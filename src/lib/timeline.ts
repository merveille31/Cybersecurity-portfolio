import type { TimelineKind } from '../types/database'

// Mêmes valeurs que la contrainte timeline_kind de 004_parcours_modules.sql
export const KIND_LABELS: Record<TimelineKind, string> = {
  formation:     'Formation',
  experience:    'Expérience',
  certification: 'Certification',
  projet:        'Projet',
  engagement:    'Engagement',
  autre:         'Autre',
}

/** "sept. 2025 → aujourd'hui" */
export function formatPeriod(start: string, end: string | null): string {
  const f = (d: string) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return `${f(start)} → ${end ? f(end) : "aujourd'hui"}`
}
