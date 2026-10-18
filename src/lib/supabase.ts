import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// On n'utilise jamais throw au niveau module : cela ferait planter toute
// l'application avant que React soit monté, rendant la page entièrement blanche.
// À la place, on exporte un flag et on laisse l'ErrorBoundary gérer l'affichage.
export const supabaseMisconfigured = !url || !key

export const supabase: SupabaseClient<Database> = supabaseMisconfigured
  ? (null as unknown as SupabaseClient<Database>)
  : createClient<Database>(url!, key!)
