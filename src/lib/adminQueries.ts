import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import type { Database, Profile, Project, Writeup, Certification } from '../types/database'

// Requêtes de l'interface d'administration.
// Contrairement à queries.ts, on lit aussi les brouillons (published = false) :
// la RLS ne les renvoie qu'aux admins.

type Tables = Database['public']['Tables']
export type ProjectInput = Tables['projects']['Insert']
export type WriteupInput = Tables['writeups']['Insert']
export type CertificationInput = Tables['certifications']['Insert']
export type ProfileInput = Tables['profile']['Update']

function check<T>(data: T, error: { message: string; code?: string } | null): T {
  if (!error) return data
  if (error.code === '23505') throw new Error('Ce slug est déjà utilisé.')
  if (error.code === '42501') throw new Error('Action refusée : ce compte n\'est pas administrateur.')
  // Mise à jour bloquée par la RLS ou ligne supprimée entre-temps : aucune ligne renvoyée
  if (error.code === 'PGRST116') throw new Error('Élément introuvable ou modification refusée.')
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
// Helpers
// ------------------------------------------------------------

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** "Mon Projet n°1 !" → "mon-projet-n-1" (même format que la contrainte SQL) */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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
