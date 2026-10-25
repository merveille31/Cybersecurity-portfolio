import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ------------------------------------------------------------
// Session
// ------------------------------------------------------------

type SessionState =
  | { status: 'loading'; session: null }
  | { status: 'ready'; session: Session | null }

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading', session: null })

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setState({ status: 'ready', session: data.session })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState({ status: 'ready', session })
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}

// ------------------------------------------------------------
// Rôle admin
// L'interface se contente d'afficher ou masquer : la vraie protection
// reste la RLS côté Supabase (is_admin() sur chaque écriture).
// ------------------------------------------------------------

type AdminState = 'checking' | 'admin' | 'denied' | 'error'

export function useIsAdmin(userId: string | undefined): AdminState {
  const [state, setState] = useState<{ userId: string | undefined; value: AdminState }>({
    userId,
    value: 'checking',
  })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return
      setState({ userId, value: error ? 'error' : data ? 'admin' : 'denied' })
    })
    return () => { cancelled = true }
  }, [userId])

  // Tant que la vérification ne concerne pas l'utilisateur courant, on attend
  return state.userId === userId ? state.value : 'checking'
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return null
  if (error.message.toLowerCase().includes('invalid')) return 'E-mail ou mot de passe incorrect.'
  return 'Connexion impossible, veuillez réessayer.'
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
