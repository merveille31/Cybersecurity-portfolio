import styled, { css } from 'styled-components'
import type { ProfileLinks as Links } from '../types/database'

// Liens vers les réseaux pros et boutons du CV, réutilisés sur l'accueil,
// la page Parcours, le contact et le pied de page.

const LABELS: Record<string, string> = {
  github:     'GitHub',
  linkedin:   'LinkedIn',
  rootme:     'Root-Me',
  tryhackme:  'TryHackMe',
  hackthebox: 'Hack The Box',
}

// Ordre d'affichage : réseaux pros d'abord, plateformes CTF ensuite
const ORDER = ['linkedin', 'github', 'rootme', 'tryhackme', 'hackthebox']
const rank = (key: string) => (ORDER.includes(key) ? ORDER.indexOf(key) : ORDER.length)

function Icon({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': true as const }
  if (name === 'github') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    )
  }
  if (name === 'linkedin') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
      </svg>
    )
  }
  // Plateformes CTF : drapeau générique
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22V4" />
      <path d="M4 4h13l-2 4 2 4H4" />
    </svg>
  )
}

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Chip = styled.a<{ $compact?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: ${({ $compact }) => ($compact ? '0.4rem' : '0.45rem 0.85rem')};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(255, 255, 255, 0.02);
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s, background 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: rgba(61, 139, 255, 0.55);
    background: ${({ theme }) => theme.colors.blueDim};
  }
`

export function SocialLinks({ links, compact = false }: { links: Links | null | undefined; compact?: boolean }) {
  const entries = Object.entries(links ?? {})
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .sort(([a], [b]) => rank(a) - rank(b))
  if (entries.length === 0) return null

  return (
    <Row>
      {entries.map(([key, url]) => {
        const label = LABELS[key] ?? key
        return (
          <Chip
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            $compact={compact}
            aria-label={compact ? label : undefined}
            title={compact ? label : undefined}
          >
            <Icon name={key} />
            {!compact && label}
          </Chip>
        )
      })}
    </Row>
  )
}

// ------------------------------------------------------------
// CV : voir (nouvel onglet) et télécharger
// ------------------------------------------------------------

/** Les fichiers publics Supabase acceptent ?download=nom pour forcer le téléchargement. */
function downloadUrl(url: string): string {
  if (!url.includes('/storage/v1/object/public/')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}download=CV-Carelle.pdf`
}

const btn = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s, color 0.15s, border-color 0.15s;
`

const DownloadBtn = styled.a`
  ${btn}
  color: ${({ theme }) => theme.colors.onAccent};
  background: ${({ theme }) => theme.colors.green};

  &:hover {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.greenHover};
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
    transform: translateY(-1px);
  }
`

const ViewBtn = styled.a`
  ${btn}
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.blue};
    background: ${({ theme }) => theme.colors.blueDim};
  }
`

export function CvButtons({ url }: { url: string | null | undefined }) {
  if (!url) return null
  return (
    <Row>
      <DownloadBtn href={downloadUrl(url)} download rel="noopener noreferrer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
        </svg>
        Télécharger mon CV
      </DownloadBtn>
      <ViewBtn href={url} target="_blank" rel="noopener noreferrer">Voir le CV</ViewBtn>
    </Row>
  )
}
