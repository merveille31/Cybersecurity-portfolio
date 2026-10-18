import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ------------------------------------------------------------
// Constantes de validation (identiques aux CHECK SQL)
// ------------------------------------------------------------
const LIMITS = {
  name:    { min: 1,  max: 100  },
  email:   { min: 6,  max: 254  },
  subject: { min: 1,  max: 200  },
  body:    { min: 1,  max: 5000 },
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BODY_MAX_BYTES = 10_240 // 10 Ko
const RATE_LIMIT = 3          // messages max
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 heure
const MIN_SUBMIT_MS = 3_000   // 3 secondes anti-bot

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Supprime les caractères de contrôle (sauf \t \n \r) */
function stripControl(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(ip + salt).digest('hex')
}

function getIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json')
  res.status(status).json(body)
}

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS minimal : uniquement depuis la même origine en production
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // 1. Méthode
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'Méthode non autorisée.' })
  }

  // 2. Content-Type
  const ct = req.headers['content-type'] ?? ''
  if (!ct.includes('application/json')) {
    return json(res, 415, { error: 'Content-Type application/json requis.' })
  }

  // 3. Taille du corps (Vercel expose le body déjà parsé, mais on vérifie
  //    la taille brute via content-length pour rejeter tôt)
  const contentLength = parseInt(req.headers['content-length'] ?? '0', 10)
  if (contentLength > BODY_MAX_BYTES) {
    return json(res, 413, { error: 'Requête trop volumineuse.' })
  }

  // 4. Extraction du corps (Vercel parse automatiquement le JSON)
  const body = req.body as Record<string, unknown>
  if (!body || typeof body !== 'object') {
    return json(res, 400, { error: 'Corps JSON invalide.' })
  }

  // 5. Champ piège honeypot — répondre comme un succès sans rien faire
  if (body.website !== '' && body.website !== undefined && body.website !== null) {
    return json(res, 201, { ok: true })
  }

  // 6. Anti-spam temporel : horodatage d'affichage du formulaire
  const shownAt = typeof body.shown_at === 'number' ? body.shown_at : 0
  if (Date.now() - shownAt < MIN_SUBMIT_MS) {
    // Répondre comme un succès sans enregistrer
    return json(res, 201, { ok: true })
  }

  // 7. Validation des champs
  const errors: Record<string, string> = {}

  const name    = typeof body.name    === 'string' ? stripControl(body.name.trim())    : ''
  const email   = typeof body.email   === 'string' ? stripControl(body.email.trim())   : ''
  const subject = typeof body.subject === 'string' ? stripControl(body.subject.trim()) : ''
  const message = typeof body.body    === 'string' ? stripControl(body.body.trim())    : ''

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max)
    errors.name = `Le nom doit contenir entre ${LIMITS.name.min} et ${LIMITS.name.max} caractères.`

  if (email.length < LIMITS.email.min || email.length > LIMITS.email.max || !EMAIL_RE.test(email))
    errors.email = 'Adresse e-mail invalide.'

  if (subject.length < LIMITS.subject.min || subject.length > LIMITS.subject.max)
    errors.subject = `Le sujet doit contenir entre ${LIMITS.subject.min} et ${LIMITS.subject.max} caractères.`

  if (message.length < LIMITS.body.min || message.length > LIMITS.body.max)
    errors.body = `Le message doit contenir entre ${LIMITS.body.min} et ${LIMITS.body.max} caractères.`

  if (Object.keys(errors).length > 0) {
    return json(res, 422, { errors })
  }

  // 8. Variables d'environnement serveur
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SECRET_KEY
  const salt        = process.env.IP_HASH_SALT ?? ''

  if (!supabaseUrl || !serviceKey) {
    // Ne pas exposer le détail de la configuration
    console.error('[contact] Variables d\'environnement manquantes')
    return json(res, 500, { error: 'Erreur de configuration serveur.' })
  }

  // 9. Client Supabase avec la clé service_role (contourne la RLS)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // 10. Rate-limiting par ip_hash
  const ip     = getIp(req)
  const ipHash = hashIp(ip, salt)
  const since  = new Date(Date.now() - RATE_WINDOW_MS).toISOString()

  const { count, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since)

  if (countError) {
    console.error('[contact] Erreur rate-limit check')
    return json(res, 500, { error: 'Erreur serveur, veuillez réessayer.' })
  }

  if ((count ?? 0) >= RATE_LIMIT) {
    return json(res, 429, { error: 'Trop de messages envoyés. Réessayez dans une heure.' })
  }

  // 11. Insertion — on ne journalise jamais le contenu ni l'e-mail
  const { error: insertError } = await supabase
    .from('messages')
    .insert({ name, email, subject, body: message, ip_hash: ipHash })

  if (insertError) {
    console.error('[contact] Erreur insertion')
    return json(res, 500, { error: 'Erreur serveur, veuillez réessayer.' })
  }

  return json(res, 201, { ok: true })
}
