import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { Project, Writeup, Profile, Certification, TimelineEntry } from '../types/database'

const PROJECT_LIST_COLS = 'id,slug,title,summary,tags,cover_url,featured,sort_order' as const
const WRITEUP_LIST_COLS =
  'id,slug,title,summary,platform,category,difficulty,tags,cover_url,published_at' as const

// ------------------------------------------------------------
// Requêtes
// ------------------------------------------------------------

// Le profil est lu par plusieurs composants d'une même page (pied de page,
// accueil, assistant) : on partage la même requête pendant une minute.
const PROFILE_TTL_MS = 60_000
let profileCache: { promise: Promise<Profile | null>; at: number } | null = null

export function fetchProfile(): Promise<Profile | null> {
  if (profileCache && Date.now() - profileCache.at < PROFILE_TTL_MS) return profileCache.promise
  const promise = (async () => {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data as Profile | null
  })()
  profileCache = { promise, at: Date.now() }
  promise.catch(() => { profileCache = null })
  return promise
}

export async function fetchTimeline(): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('published', true)
    .order('start_date', { ascending: false })
    .order('sort_order', { ascending: true })
  // Table absente tant que la migration 004 n'est pas appliquée : section vide
  if (error && (error.code === 'PGRST205' || error.code === '42P01')) return []
  if (error) throw new Error(error.message)
  return (data ?? []) as TimelineEntry[]
}

export async function fetchCertifications(): Promise<Certification[]> {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Certification[]
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_LIST_COLS)
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Project[]
}

export async function fetchProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Project | null
}

export async function fetchWriteups(): Promise<Writeup[]> {
  const { data, error } = await supabase
    .from('writeups')
    .select(WRITEUP_LIST_COLS)
    .eq('published', true)
    .order('published_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Writeup[]
}

export async function fetchWriteupBySlug(slug: string): Promise<Writeup | null> {
  const { data, error } = await supabase
    .from('writeups')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Writeup | null
}

// ------------------------------------------------------------
// Hook générique
// ------------------------------------------------------------

type QueryState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'error'; data: null; error: string }
  | { status: 'success'; data: T; error: null }

export function useQuery<T>(fn: () => Promise<T>): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null })
    fn()
      .then(data => {
        if (!cancelled) setState({ status: 'success', data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            data: null,
            error: err instanceof Error ? err.message : 'Erreur inconnue',
          })
      })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
