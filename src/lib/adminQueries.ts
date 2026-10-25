import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import type { Database, Profile, Project, Writeup, Certification, TimelineEntry, Message, Modules } from '../types/database'

// Requêtes de l'interface d'administration.
// Contrairement à queries.ts, on lit aussi les brouillons (published = false) :
// la RLS ne les renvoie qu'aux admins.

type Tables = Database['public']['Tables']
export type ProjectInput = Tables['projects']['Insert']
export type WriteupInput = Tables['writeups']['Insert']
export type CertificationInput = Tables['certifications']['Insert']
export type ProfileInput = Tables['profile']['Update']
export type TimelineInput = Tables['timeline']['Insert']

function check<T>(data: T, error: { message: string; code?: string } | null): T {
  if (!error) return data
  if (error.code === '23505') throw new Error('Ce slug est déjà utilisé.')
  if (error.code === '42501') throw new Error('Action refusée : ce compte n\'est pas administrateur.')
  // Mise à jour bloquée par la RLS ou ligne supprimée entre-temps : aucune ligne renvoyée
  if (error.code === 'PGRST116') throw new Error('Élément introuvable ou modification refusée.')
  // Table ou colonne créée par une migration pas encore exécutée
  if (error.code === 'PGRST205' || error.code === '42P01' || error.code === 'PGRST204' || error.code === '42703') {
    throw new Error("La base n'est pas à jour : exécutez supabase/migrations/004_parcours_modules.sql dans Supabase.")
  }
  throw new Error(error.message)
}

// Une suppression bloquée par la RLS ne renvoie pas d'erreur, juste 0 ligne
// (les écritures, elles, utilisent .single() qui échoue en PGRST116)
function ensureDeleted(rows: { id: number }[] | null): void {
  if (!rows || rows.length === 0) throw new Error('Élément introuvable ou suppression refusée.')
}

// ------------------------------------------------------------
// Profil
// ------------------------------------------------------------

export async function adminFetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle()
  return check(data as Profile | null, error)
}

export async function adminSaveProfile(input: ProfileInput): Promise<void> {
  // upsert : crée la ligne id = 1 si le seed n'a pas été exécuté
  const { data, error } = await supabase
    .from('profile')
    .upsert({ ...input, id: 1 } as Tables['profile']['Insert'])
    .select('id')
    .single()
  check(data, error)
}

// ------------------------------------------------------------
// Fichiers (bucket public "media", écriture réservée aux admins par la RLS)
// ------------------------------------------------------------

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // même limite que le bucket

export const UPLOAD_KINDS = {
  cv:     { folder: 'cv',      accept: 'application/pdf', types: ['application/pdf'], label: 'un PDF' },
  avatar: { folder: 'avatars', accept: 'image/png,image/jpeg,image/webp', types: ['image/png', 'image/jpeg', 'image/webp'], label: 'une image PNG, JPEG ou WebP' },
  image:  { folder: 'images',  accept: 'image/png,image/jpeg,image/webp', types: ['image/png', 'image/jpeg', 'image/webp'], label: 'une image PNG, JPEG ou WebP' },
} as const

export type UploadKind = keyof typeof UPLOAD_KINDS

/** Envoie un fichier dans le bucket "media" et renvoie son URL publique. */
export async function adminUploadFile(kind: UploadKind, file: File): Promise<string> {
  const conf = UPLOAD_KINDS[kind]
  if (!(conf.types as readonly string[]).includes(file.type)) throw new Error(`Format refusé : choisissez ${conf.label}.`)
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Fichier trop lourd (5 Mo maximum).')

  // Nom unique pour éviter que le navigateur garde l'ancienne version en cache
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || kind
  const path = `${conf.folder}/${Date.now()}-${base}.${ext}`

  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) {
    if (/row-level security|unauthorized|403/i.test(error.message)) {
      throw new Error("Envoi refusé : ce compte n'est pas administrateur.")
    }
    throw new Error(error.message)
  }
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

// ------------------------------------------------------------
// Projets
// ------------------------------------------------------------

export async function adminFetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
  return check((data ?? []) as Project[], error)
}

export async function adminFetchProject(id: number): Promise<Project | null> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  return check(data as Project | null, error)
}

export async function adminSaveProject(id: number | null, input: ProjectInput): Promise<number> {
  const query = id === null
    ? supabase.from('projects').insert(input)
    : supabase.from('projects').update(input).eq('id', id)
  const { data, error } = await query.select('id').single()
  return check(data, error)!.id
}

export async function adminDeleteProject(id: number): Promise<void> {
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id')
  ensureDeleted(check(data, error))
}

// ------------------------------------------------------------
// Write-ups
// ------------------------------------------------------------

export async function adminFetchWriteups(): Promise<Writeup[]> {
  const { data, error } = await supabase
    .from('writeups')
    .select('*')
    .order('created_at', { ascending: false })
  return check((data ?? []) as Writeup[], error)
}

export async function adminFetchWriteup(id: number): Promise<Writeup | null> {
  const { data, error } = await supabase.from('writeups').select('*').eq('id', id).maybeSingle()
  return check(data as Writeup | null, error)
}

export async function adminSaveWriteup(id: number | null, input: WriteupInput): Promise<number> {
  const query = id === null
    ? supabase.from('writeups').insert(input)
    : supabase.from('writeups').update(input).eq('id', id)
  const { data, error } = await query.select('id').single()
  return check(data, error)!.id
}

export async function adminDeleteWriteup(id: number): Promise<void> {
  const { data, error } = await supabase.from('writeups').delete().eq('id', id).select('id')
  ensureDeleted(check(data, error))
}

// ------------------------------------------------------------
// Certifications
// ------------------------------------------------------------

export async function adminFetchCertifications(): Promise<Certification[]> {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .order('sort_order', { ascending: true })
  return check((data ?? []) as Certification[], error)
}

export async function adminSaveCertification(
  id: number | null,
  input: CertificationInput,
): Promise<void> {
  const query = id === null
    ? supabase.from('certifications').insert(input)
    : supabase.from('certifications').update(input).eq('id', id)
  const { data, error } = await query.select('id').single()
  check(data, error)
}

export async function adminDeleteCertification(id: number): Promise<void> {
  const { data, error } = await supabase.from('certifications').delete().eq('id', id).select('id')
  ensureDeleted(check(data, error))
}

// ------------------------------------------------------------
// Parcours (table timeline, migration 004)
// ------------------------------------------------------------

export async function adminFetchTimeline(): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .order('start_date', { ascending: false })
    .order('sort_order', { ascending: true })
  return check((data ?? []) as TimelineEntry[], error)
}

export async function adminSaveTimeline(id: number | null, input: TimelineInput): Promise<void> {
  const query = id === null
    ? supabase.from('timeline').insert(input)
    : supabase.from('timeline').update(input).eq('id', id)
  const { data, error } = await query.select('id').single()
  check(data, error)
}

export async function adminDeleteTimeline(id: number): Promise<void> {
  const { data, error } = await supabase.from('timeline').delete().eq('id', id).select('id')
  ensureDeleted(check(data, error))
}

// ------------------------------------------------------------
// Messages du formulaire de contact
// ------------------------------------------------------------

export async function adminFetchMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id,name,email,subject,body,read,created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  return check((data ?? []) as Message[], error)
}

export async function adminSetMessageRead(id: number, read: boolean): Promise<void> {
  const { data, error } = await supabase.from('messages').update({ read }).eq('id', id).select('id').single()
  check(data, error)
}

export async function adminDeleteMessage(id: number): Promise<void> {
  const { data, error } = await supabase.from('messages').delete().eq('id', id).select('id')
  ensureDeleted(check(data, error))
}

// ------------------------------------------------------------
// Modules (profile.modules, migration 004)
// ------------------------------------------------------------

export async function adminSaveModules(modules: Modules): Promise<void> {
  const { data, error } = await supabase
    .from('profile')
    .update({ modules })
    .eq('id', 1)
    .select('id')
    .single()
  check(data, error)
}

// ------------------------------------------------------------
// Vue d'ensemble
// ------------------------------------------------------------

export type Overview = {
  projects: { total: number; published: number }
  writeups: { total: number; published: number }
  certifications: number
  timeline: number | null // null : migration 004 absente
  messages: { total: number; unread: number }
  profileComplete: { label: string; ok: boolean }[]
}

async function countRows(table: 'projects' | 'writeups' | 'certifications' | 'timeline' | 'messages', filter?: [string, boolean]) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  if (filter) q = q.eq(filter[0], filter[1])
  const { count, error } = await q
  // Table absente : pas toujours d'erreur sur une requête "head", juste un compte nul
  return error || count === null ? null : count
}

export async function adminFetchOverview(): Promise<Overview> {
  const [pT, pP, wT, wP, c, t, mT, mU, profile] = await Promise.all([
    countRows('projects'), countRows('projects', ['published', true]),
    countRows('writeups'), countRows('writeups', ['published', true]),
    countRows('certifications'), countRows('timeline'),
    countRows('messages'), countRows('messages', ['read', false]),
    adminFetchProfile().catch(() => null),
  ])
  const looksReal = (v: string | undefined) => Boolean(v) && !String(v).includes('example.com')
  return {
    projects: { total: pT ?? 0, published: pP ?? 0 },
    writeups: { total: wT ?? 0, published: wP ?? 0 },
    certifications: c ?? 0,
    timeline: t,
    messages: { total: mT ?? 0, unread: mU ?? 0 },
    profileComplete: [
      { label: 'Photo de profil', ok: looksReal(profile?.avatar_url) },
      { label: 'CV en PDF', ok: looksReal(profile?.cv_url) },
      { label: 'Bio', ok: Boolean(profile?.bio && profile.bio.length > 40) },
      { label: 'E-mail public', ok: looksReal(profile?.email_public) },
      { label: 'Lien LinkedIn', ok: looksReal(profile?.links?.linkedin) && !profile?.links?.linkedin?.endsWith('/in/carelle') },
      { label: 'Compétences', ok: Object.values(profile?.skills ?? {}).some(list => list && list.length > 0) },
    ],
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** "Mon Projet n°1 !" → "mon-projet-n-1" (même format que la contrainte SQL) */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Erreur inconnue'
}

// ------------------------------------------------------------
// Hook avec rechargement (après création / suppression)
// `fn` doit être stable : fonction de module ou useCallback.
// ------------------------------------------------------------

type AdminQueryState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'error'; data: null; error: string }
  | { status: 'success'; data: T; error: null }

export function useAdminQuery<T>(fn: () => Promise<T>): AdminQueryState<T> & { reload: () => void } {
  const [state, setState] = useState<AdminQueryState<T>>({ status: 'loading', data: null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    fn()
      .then(data => { if (!cancelled) setState({ status: 'success', data, error: null }) })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', data: null, error: errorText(err) })
      })
    return () => { cancelled = true }
  }, [fn, tick])

  const reload = useCallback(() => setTick(t => t + 1), [])
  return { ...state, reload }
}
