import { useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import { useQuery, fetchProfile, fetchCertifications } from '../lib/queries'
import { Skeleton, ErrorMessage } from '../components/ui'
import type { ProfileSkills } from '../types/database'

// ------------------------------------------------------------
// Layout
// ------------------------------------------------------------
const PageGrid = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

// ------------------------------------------------------------
// Photo
// ------------------------------------------------------------
const AvatarWrap = styled.div`
  position: sticky;
  top: 72px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    display: flex;
    justify-content: center;
  }
`

const AvatarRing = styled.div`
  width: 200px;
  height: 200px;
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 2px;
  background: ${({ theme }) => theme.colors.magenta};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 140px;
    height: 140px;
  }
`

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: calc(${({ theme }) => theme.radius.xl} - 2px);
  display: block;
  background: ${({ theme }) => theme.colors.surface};
`

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: calc(${({ theme }) => theme.radius.xl} - 2px);
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
`

// ------------------------------------------------------------
// Contenu principal
// ------------------------------------------------------------
const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(1.6rem, 4vw, 2.25rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 0.25rem;
`

const Headline = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.magenta};
  margin: 0;
`

const Bio = styled.p`
  font-size: 0.975rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.75;
  max-width: 60ch;
`

const Location = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.muted};
`

// ------------------------------------------------------------
// Compétences
// ------------------------------------------------------------
const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const BlockTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const SkillGroups = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`

const SkillGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const GroupLabel = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.mandarine};
  text-transform: lowercase;
  margin: 0;
`

const SkillList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const SkillItem = styled.li`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  padding-left: 0.75rem;
  position: relative;

  &::before {
    content: '·';
    position: absolute;
    left: 0;
    color: ${({ theme }) => theme.colors.border};
  }
`

// ------------------------------------------------------------
// Certifications
// ------------------------------------------------------------
const CertTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const CertItem = styled.div<{ $obtained: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.875rem 1.125rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $obtained, theme }) =>
    $obtained ? theme.colors.success + '44' : theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`

const CertDot = styled.span<{ $obtained: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $obtained, theme }) =>
    $obtained ? theme.colors.success : theme.colors.border};
  flex-shrink: 0;
  margin-top: 4px;
`

const CertBody = styled.div`
  flex: 1;
  min-width: 0;
`

const CertName = styled.p`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 0.2rem;
`

const CertMeta = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.muted};
  margin: 0;
`

const CertLink = styled.a`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.violet};
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: ${({ theme }) => theme.colors.violetHover}; }
`

const StatusBadge = styled.span<{ $obtained: boolean }>`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.65rem;
  padding: 1px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $obtained, theme }) =>
    $obtained ? theme.colors.success + '22' : theme.colors.border};
  color: ${({ $obtained, theme }) =>
    $obtained ? theme.colors.success : theme.colors.muted};
  border: 1px solid ${({ $obtained, theme }) =>
    $obtained ? theme.colors.success + '55' : theme.colors.border};
  flex-shrink: 0;
`

// ------------------------------------------------------------
// Liens profils
// ------------------------------------------------------------
const ProfileLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
`

const ProfileLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.muted};
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.violet};
    color: ${({ theme }) => theme.colors.text};
  }
`

const CvBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.magenta};
  color: #140A1E;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.magentaHover}; color: #140A1E; }
  &:active { background: ${({ theme }) => theme.colors.magentaPressed}; }
`

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const SKILL_GROUP_LABELS: Record<string, string> = {
  offensif: 'offensif',
  défensif: 'défensif',
  réseau:   'réseau',
  outils:   'outils',
}

const PROFILE_LINK_LABELS: Record<string, string> = {
  github:    'GitHub',
  linkedin:  'LinkedIn',
  rootme:    'Root-Me',
  tryhackme: 'TryHackMe',
  hackthebox:'HackTheBox',
}

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
}

// ------------------------------------------------------------
// Squelettes
// ------------------------------------------------------------
function AvatarSkeleton() {
  return (
    <AvatarWrap>
      <Skeleton $h="200px" $w="200px" $radius="24px" />
    </AvatarWrap>
  )
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

  const links = profile?.links ?? {}
  const linkEntries = Object.entries(links).filter(([, v]) => !!v)

  return (
    <>
      <Helmet><title>À propos · Carelle</title></Helmet>

      <PageGrid>
        {/* Colonne gauche : photo */}
        {profileQ.status === 'loading'
          ? <AvatarSkeleton />
          : (
            <AvatarWrap>
              <AvatarRing>
                {profile?.avatar_url
                  ? <AvatarImg src={profile.avatar_url} alt={profile.full_name} loading="lazy" />
                  : <AvatarPlaceholder>photo</AvatarPlaceholder>
                }
              </AvatarRing>
            </AvatarWrap>
          )
        }

        {/* Colonne droite : contenu */}
        <Content>
          {profileQ.status === 'error' && <ErrorMessage message={profileQ.error} />}

          {/* Identité */}
          <div>
            <PageTitle>{profile?.full_name ?? 'Carelle'}</PageTitle>
            {profile?.headline && <Headline>{profile.headline}</Headline>}
            {profile?.location && <Location style={{ marginTop: '0.5rem' }}>{profile.location}</Location>}
            {profile?.bio && <Bio style={{ marginTop: '1rem' }}>{profile.bio}</Bio>}
          </div>

          {/* Compétences */}
          {skillEntries.length > 0 && (
            <Block>
              <BlockTitle>Compétences</BlockTitle>
              <SkillGroups>
                {skillEntries.map(([group, items]) => (
                  <SkillGroup key={group}>
                    <GroupLabel>{SKILL_GROUP_LABELS[group] ?? group}</GroupLabel>
                    <SkillList>
                      {(items ?? []).map(skill => (
                        <SkillItem key={skill}>{skill}</SkillItem>
                      ))}
                    </SkillList>
                  </SkillGroup>
                ))}
              </SkillGroups>
            </Block>
          )}

          {/* Certifications */}
          {(certsQ.status === 'loading' || certs.length > 0) && (
            <Block>
              <BlockTitle>Certifications</BlockTitle>
              {certsQ.status === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton $h="64px" $radius="10px" />
                  <Skeleton $h="64px" $radius="10px" />
                </div>
              )}
              {certsQ.status === 'success' && (
                <CertTimeline>
                  {certs.map(cert => {
                    const obtained = cert.status === 'obtenue'
                    return (
                      <CertItem key={cert.id} $obtained={obtained}>
                        <CertDot $obtained={obtained} aria-hidden="true" />
                        <CertBody>
                          <CertName>{cert.name}</CertName>
                          <CertMeta>
                            {cert.issuer}
                            {cert.obtained_at ? ` · ${fmtDate(cert.obtained_at)}` : ''}
                          </CertMeta>
                          {cert.credential_url && (
                            <CertLink
                              href={cert.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Vérifier le certificat
                            </CertLink>
                          )}
                        </CertBody>
                        <StatusBadge $obtained={obtained}>
                          {obtained ? 'obtenue' : 'en cours'}
                        </StatusBadge>
                      </CertItem>
                    )
                  })}
                </CertTimeline>
              )}
            </Block>
          )}

          {/* Liens profils + CV */}
          {(linkEntries.length > 0 || profile?.cv_url) && (
            <Block>
              <BlockTitle>Retrouvez-moi</BlockTitle>
              <ProfileLinks>
                {linkEntries.map(([key, url]) => (
                  <ProfileLink
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={PROFILE_LINK_LABELS[key] ?? key}
                  >
                    {PROFILE_LINK_LABELS[key] ?? key}
                  </ProfileLink>
                ))}
              </ProfileLinks>
              {profile?.cv_url && (
                <div style={{ marginTop: '0.5rem' }}>
                  <CvBtn
                    href={profile.cv_url}
                    download
                    rel="noopener noreferrer"
                    aria-label="Télécharger le CV"
                  >
                    Télécharger le CV
                  </CvBtn>
                </div>
              )}
            </Block>
          )}
        </Content>
      </PageGrid>
    </>
  )
}
