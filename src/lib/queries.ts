import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { Project, Writeup, Profile, Certification } from '../types/database'

const PROJECT_LIST_COLS = 'id,slug,title,summary,tags,cover_url,featured,sort_order' as const
const WRITEUP_LIST_COLS =
  'id,slug,title,summary,platform,category,difficulty,tags,cover_url,published_at' as const

// ------------------------------------------------------------
// Requêtes
// ------------------------------------------------------------

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Profile | null
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
