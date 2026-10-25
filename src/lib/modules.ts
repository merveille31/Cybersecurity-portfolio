import type { Profile } from '../types/database'

// Registre des modules activables depuis l'admin (onglet « Modules »).
// La valeur est stockée dans profile.modules ; une clé absente = activé.

export type ModuleDef = { key: string; label: string; description: string }

export const MODULE_GROUPS: { title: string; modules: ModuleDef[] }[] = [
  {
    title: "Sections de l'accueil",
    modules: [
      { key: 'terminal',       label: 'Terminal interactif',  description: 'Le terminal animé à côté de la présentation.' },
      { key: 'stats',          label: 'Chiffres clés',        description: 'Nombre de projets, articles et certifications.' },
      { key: 'parcours',       label: 'Parcours',             description: 'La frise interactive des formations et expériences.' },
      { key: 'skills',         label: 'Compétences',          description: 'Les groupes de compétences.' },
      { key: 'certifications', label: 'Certifications',       description: 'La liste des certifications.' },
    ],
  },
  {
    title: 'Pages et fonctionnalités',
    modules: [
      { key: 'projects',  label: 'Projets',      description: "Page Projets, son onglet dans le menu et la section de l'accueil." },
      { key: 'blog',      label: 'Blog',         description: "Page Blog (write-ups), son onglet dans le menu et la section de l'accueil." },
      { key: 'assistant', label: 'Assistant IA', description: 'Le bouton « Une question ? » en bas à droite.' },
      { key: 'cv',        label: 'CV',           description: 'Les boutons Voir / Télécharger le CV.' },
    ],
  },
  {
    title: 'Réseaux sociaux',
    modules: [
      { key: 'socials',          label: 'Tous les réseaux', description: 'Coupe tous les liens d\'un coup.' },
      { key: 'social_linkedin',  label: 'LinkedIn',     description: '' },
      { key: 'social_github',    label: 'GitHub',       description: '' },
      { key: 'social_rootme',    label: 'Root-Me',      description: '' },
      { key: 'social_tryhackme', label: 'TryHackMe',    description: '' },
      { key: 'social_hackthebox',label: 'Hack The Box', description: '' },
    ],
  },
]

/** Un module est actif sauf s'il a été explicitement désactivé. */
export function isOn(profile: Profile | null | undefined, key: string): boolean {
  return profile?.modules?.[key] !== false
}

/** Liens visibles : module global + module par réseau. */
export function visibleLinks(profile: Profile | null | undefined): Profile['links'] {
  if (!profile || !isOn(profile, 'socials')) return {}
  return Object.fromEntries(
    Object.entries(profile.links ?? {}).filter(([key, url]) => url && isOn(profile, `social_${key}`)),
  )
}
