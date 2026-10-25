import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'
import { useQuery, fetchProfile, fetchCertifications } from '../lib/queries'
import { Skeleton, ErrorMessage } from '../components/ui'
import { Eyebrow, Reveal } from '../components/cards'
import { SocialLinks, CvButtons } from '../components/ProfileLinks'
import type { ProfileSkills } from '../types/database'

// ------------------------------------------------------------
// En-tête : photo + identité + CV + liens
// ------------------------------------------------------------
const Intro = styled.section`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2.5rem;
  align-items: center;
  padding-bottom: 3rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const AvatarRing = styled.div`
  width: 196px;
  height: 196px;
  border-radius: 28px;
  padding: 3px;
  background: ${({ theme }) => theme.colors.gradient};
  box-shadow: 0 20px 60px -20px rgba(34, 229, 138, 0.45);

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 132px;
    height: 132px;
    border-radius: 22px;
  }
`

const AvatarInner = styled.div`
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 3.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.green};

  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const Identity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
`

const Name = styled.h1`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
`

const Headline = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  max-width: 52ch;
`

const Location = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.muted};
`

// ------------------------------------------------------------
// Blocs de contenu
// ------------------------------------------------------------
const Block = styled.section`
  padding-top: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const BlockTitle = styled.h2`
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  font-weight: 700;
  margin-top: 0.3rem;
`

const Bio = styled.div`
  font-size: 1.02rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.8;
  max-width: 68ch;

  p + p { margin-top: 0.9rem; }
  strong { color: ${({ theme }) => theme.colors.text}; }
  a { color: ${({ theme }) => theme.colors.blue}; text-decoration: underline; text-underline-offset: 3px; }
`

// ------------------------------------------------------------
// Compétences
// ------------------------------------------------------------
const SkillGroups = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
`

const SkillCard = styled.div`
  padding: 1.15rem 1.2rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  height: 100%;
  transition: border-color 0.2s;

  &:hover { border-color: rgba(34, 229, 138, 0.4); }
`

const GroupLabel = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.gradient};
  }
`

const SkillList = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const SkillItem = styled.li`
  font-size: 0.8rem;
  padding: 0.25rem 0.65rem;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ theme }) => theme.colors.text};
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${({ theme }) => theme.colors.border};
`

// ------------------------------------------------------------
// Certifications
// ------------------------------------------------------------
const CertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const CertItem = styled.div<{ $obtained: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $obtained, theme }) => ($obtained ? 'rgba(34, 229, 138, 0.35)' : theme.colors.border)};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`

const CertIcon = styled.span<{ $obtained: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: ${({ theme }) => theme.radius.md};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: ${({ $obtained, theme }) => ($obtained ? theme.colors.green : theme.colors.blue)};
  background: ${({ $obtained, theme }) => ($obtained ? theme.colors.greenDim : theme.colors.blueDim)};
`

const CertBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`

const CertName = styled.p`
  font-weight: 600;
`

const CertMeta = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.muted};
`

const CertLink = styled.a`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.blue};
  white-space: nowrap;
  &::after { content: ' ↗'; }
`

const StatusBadge = styled.span<{ $obtained: boolean }>`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.radius.full};
  white-space: nowrap;
  color: ${({ $obtained, theme }) => ($obtained ? theme.colors.green : theme.colors.blue)};
  border: 1px solid ${({ $obtained }) => ($obtained ? 'rgba(34, 229, 138, 0.45)' : 'rgba(61, 139, 255, 0.45)')};
`

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const SKILL_GROUP_LABELS: Record<string, string> = {
  offensif: 'Sécurité offensive',
  défensif: 'Sécurité défensive',
  réseau:   'Réseau',
  outils:   'Outils',
}

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function About() {
  const profileQ = useQuery(useCallback(() => fetchProfile(), []))
  const certsQ = useQuery(useCallback(() => fetchCertifications(), []))

  const profile = profileQ.status === 'success' ? profileQ.data : null
  const certs = certsQ.status === 'success' ? certsQ.data : []

  const skills: ProfileSkills = profile?.skills ?? {}
  const skillEntries = Object.entries(skills).filter(([, v]) => v && v.length > 0)
  const name = profile?.full_name || 'Carelle'
  // Si la photo ne se charge pas (URL cassée), on affiche l'initiale
  const [avatarFailed, setAvatarFailed] = useState<string | null>(null)
  const showAvatar = Boolean(profile?.avatar_url) && avatarFailed !== profile?.avatar_url

  return (
    <>
      <Helmet><title>Parcours · Carelle</title></Helmet>

      {profileQ.status === 'error' && <ErrorMessage message={profileQ.error} />}

      <Intro>
        {profileQ.status === 'loading'
          ? <Skeleton $h="196px" $w="196px" $radius="28px" />
          : (
            <AvatarRing>
              <AvatarInner>
                {showAvatar
                  ? <img src={profile!.avatar_url} alt={`Photo de ${name}`} onError={() => setAvatarFailed(profile!.avatar_url)} />
                  : <span aria-hidden="true">{name.charAt(0)}</span>}
              </AvatarInner>
            </AvatarRing>
          )}

        <Identity>
          <Eyebrow>~/parcours</Eyebrow>
          <Name>{name}</Name>
          {profile?.headline && <Headline>{profile.headline}</Headline>}
          {profile?.location && (
            <Location>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {profile.location}
            </Location>
          )}
          {profile && (
            <>
              <CvButtons url={profile.cv_url} />
              <SocialLinks links={profile.links} />
            </>
          )}
        </Identity>
      </Intro>

      {profile?.bio && (
        <Reveal>
          <Block>
            <div>
              <Eyebrow>qui je suis</Eyebrow>
              <BlockTitle>À propos de moi</BlockTitle>
            </div>
            <Bio><ReactMarkdown>{profile.bio}</ReactMarkdown></Bio>
          </Block>
        </Reveal>
      )}

      {skillEntries.length > 0 && (
        <Block>
          <Reveal>
            <Eyebrow>ce que je sais faire</Eyebrow>
            <BlockTitle>Compétences</BlockTitle>
          </Reveal>
          <SkillGroups>
            {skillEntries.map(([group, items], i) => (
              <Reveal key={group} delay={i * 0.06}>
                <SkillCard>
                  <GroupLabel>{SKILL_GROUP_LABELS[group] ?? group}</GroupLabel>
                  <SkillList>
                    {(items ?? []).map(skill => <SkillItem key={skill}>{skill}</SkillItem>)}
                  </SkillList>
                </SkillCard>
              </Reveal>
            ))}
          </SkillGroups>
        </Block>
      )}

      {(certsQ.status === 'loading' || certs.length > 0) && (
        <Block>
          <Reveal>
            <Eyebrow>ce qui le prouve</Eyebrow>
            <BlockTitle>Certifications</BlockTitle>
          </Reveal>
          {certsQ.status === 'loading' && <Skeleton $h="140px" $radius="10px" />}
          <CertList>
            {certs.map((cert, i) => {
              const obtained = cert.status === 'obtenue'
              return (
                <Reveal key={cert.id} delay={i * 0.05}>
                  <CertItem $obtained={obtained}>
                    <CertIcon $obtained={obtained} aria-hidden="true">{obtained ? '✓' : '◷'}</CertIcon>
                    <CertBody>
                      <CertName>{cert.name}</CertName>
                      <CertMeta>
                        {cert.issuer}
                        {cert.obtained_at ? ` · ${fmtDate(cert.obtained_at)}` : ''}
                      </CertMeta>
                    </CertBody>
                    {cert.credential_url && (
                      <CertLink href={cert.credential_url} target="_blank" rel="noopener noreferrer">
                        Vérifier
                      </CertLink>
                    )}
                    <StatusBadge $obtained={obtained}>{obtained ? 'obtenue' : 'en cours'}</StatusBadge>
                  </CertItem>
                </Reveal>
              )
            })}
          </CertList>
        </Block>
      )}
    </>
  )
}
