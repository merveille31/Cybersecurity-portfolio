import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import {
  useQuery,
  fetchProfile,
  fetchProjects,
  fetchWriteups,
  fetchCertifications,
} from '../lib/queries'
import Terminal from '../components/Terminal'
import { Skeleton, Badge, CategoryBadge, Tag } from '../components/ui'
import type { Project, Writeup } from '../types/database'

// ------------------------------------------------------------
// Héros
// ------------------------------------------------------------
const Hero = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 3.5rem 0 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem 0 2.5rem;
  }
`

const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.magenta};
  letter-spacing: 0.02em;
`

const HeroTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 700;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const HeroSub = styled.p`
  font-size: 1.05rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.65;
  max-width: 44ch;
`

const HeroLinks = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`

const PrimaryBtn = styled(Link)`
  display: inline-block;
  padding: 0.6rem 1.4rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.magenta};
  color: #140A1E;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.15s;
  text-decoration: none;

  &:hover { background: ${({ theme }) => theme.colors.magentaHover}; color: #140A1E; }
  &:active { background: ${({ theme }) => theme.colors.magentaPressed}; }
`

const SecondaryBtn = styled(Link)`
  display: inline-block;
  padding: 0.6rem 1.4rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.9rem;
  transition: border-color 0.15s, color 0.15s;
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.violet};
    color: ${({ theme }) => theme.colors.text};
  }
`

// ------------------------------------------------------------
// Séparateur
// ------------------------------------------------------------
const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 0;
`

// ------------------------------------------------------------
// Sections sous le héros
// ------------------------------------------------------------
const Section = styled.section`
  padding: 3rem 0;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
`

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const SeeAll = styled(Link)`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.violet};
  white-space: nowrap;
  &:hover { color: ${({ theme }) => theme.colors.violetHover}; }
`

// ------------------------------------------------------------
// Grille projets
// ------------------------------------------------------------
const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`

const ProjectCard = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  text-decoration: none;
  transition: border-color 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.violet}55; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.violet}; outline-offset: 2px; }
`

const ProjectCover = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
`

const ProjectCoverPlaceholder = styled.div`
  width: 100%;
  height: 140px;
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.muted};
`

const ProjectBody = styled.div`
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
`

const ProjectTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const ProjectSummary = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.5;
  flex: 1;
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.25rem;
`

// ------------------------------------------------------------
// Liste write-ups
// ------------------------------------------------------------
const WriteupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`

const WriteupCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.125rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  text-decoration: none;
  transition: border-color 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.violet}55; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.violet}; outline-offset: 2px; }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`

const WriteupTitle = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  flex: 1;
  min-width: 0;
`

const WriteupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`

// ------------------------------------------------------------
// CTA
// ------------------------------------------------------------
const CtaBox = styled.section`
  padding: 3rem 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const CtaTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const CtaText = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.95rem;
  max-width: 52ch;
  line-height: 1.65;
`

// ------------------------------------------------------------
// Squelettes
// ------------------------------------------------------------
function ProjectSkeleton() {
  return (
    <ProjectGrid>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#1F1230', border: '1px solid #2E1C45' }}>
          <Skeleton $h="140px" $radius="0" />
          <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton $h="0.9rem" $w="55%" />
            <Skeleton $h="0.8rem" />
            <Skeleton $h="0.8rem" $w="70%" />
          </div>
        </div>
      ))}
    </ProjectGrid>
  )
}

function WriteupSkeleton() {
  return (
    <WriteupList>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ padding: '0.875rem 1.125rem', borderRadius: 10, background: '#1F1230', border: '1px solid #2E1C45', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Skeleton $h="0.9rem" $w="60%" />
          <Skeleton $h="1.2rem" $w="60px" $radius="999px" />
        </div>
      ))}
    </WriteupList>
  )
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function Home() {
  const profileQ = useQuery(useCallback(() => fetchProfile(), []))
  const projectsQ = useQuery(useCallback(() => fetchProjects(), []))
  const writeupsQ = useQuery(useCallback(() => fetchWriteups(), []))
  const certsQ = useQuery(useCallback(() => fetchCertifications(), []))

  const profile = profileQ.status === 'success' ? profileQ.data : null
  const projects: Project[] = projectsQ.status === 'success' ? projectsQ.data.slice(0, 3) : []
  const writeups: Writeup[] = writeupsQ.status === 'success' ? writeupsQ.data.slice(0, 3) : []

  const termData = {
    profile,
    projects: projectsQ.status === 'success' ? projectsQ.data : [],
    writeups: writeupsQ.status === 'success' ? writeupsQ.data : [],
    certifications: certsQ.status === 'success' ? certsQ.data : [],
  }

  return (
    <>
      <Helmet><title>Carelle · Cybersécurité</title></Helmet>

      {/* Héros */}
      <Hero>
        <HeroText>
          <Eyebrow>~/carelle $</Eyebrow>
          <HeroTitle>
            {profile?.full_name ?? 'Carelle'}
          </HeroTitle>
          <HeroSub>
            {profile?.headline ?? 'Étudiante en cybersécurité · CTF player'}
          </HeroSub>
          <HeroLinks>
            <PrimaryBtn to="/a-propos">À propos</PrimaryBtn>
            <SecondaryBtn to="/projets">Voir les projets</SecondaryBtn>
          </HeroLinks>
        </HeroText>

        <Terminal data={termData} autoplay />
      </Hero>

      <Divider />

      {/* Projets mis en avant */}
      <Section aria-labelledby="featured-projects">
        <SectionHeader>
          <SectionTitle id="featured-projects">Projets</SectionTitle>
          <SeeAll to="/projets">Tous les projets</SeeAll>
        </SectionHeader>

        {projectsQ.status === 'loading' && <ProjectSkeleton />}
        {projectsQ.status === 'success' && projects.length > 0 && (
          <ProjectGrid>
            {projects.map(p => (
              <ProjectCard key={p.slug} to={`/projets/${p.slug}`}>
                {p.cover_url
                  ? <ProjectCover src={p.cover_url} alt={p.title} loading="lazy" />
                  : <ProjectCoverPlaceholder>~/projets/{p.slug}</ProjectCoverPlaceholder>
                }
                <ProjectBody>
                  <ProjectTitle>{p.title}</ProjectTitle>
                  {p.summary && <ProjectSummary>{p.summary}</ProjectSummary>}
                  {p.tags.length > 0 && (
                    <TagRow>{p.tags.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}</TagRow>
                  )}
                </ProjectBody>
              </ProjectCard>
            ))}
          </ProjectGrid>
        )}
      </Section>

      <Divider />

      {/* Derniers write-ups */}
      <Section aria-labelledby="recent-writeups">
        <SectionHeader>
          <SectionTitle id="recent-writeups">Write-ups récents</SectionTitle>
          <SeeAll to="/writeups">Tous les write-ups</SeeAll>
        </SectionHeader>

        {writeupsQ.status === 'loading' && <WriteupSkeleton />}
        {writeupsQ.status === 'success' && writeups.length > 0 && (
          <WriteupList>
            {writeups.map(w => (
              <WriteupCard key={w.slug} to={`/writeups/${w.slug}`}>
                <WriteupTitle>{w.title}</WriteupTitle>
                <WriteupMeta>
                  <CategoryBadge>{w.category}</CategoryBadge>
                  <Badge $value={w.difficulty}>{w.difficulty}</Badge>
                </WriteupMeta>
              </WriteupCard>
            ))}
          </WriteupList>
        )}
      </Section>

      {/* CTA */}
      <CtaBox aria-labelledby="cta-heading">
        <CtaTitle id="cta-heading">Une question ? Un projet ?</CtaTitle>
        <CtaText>
          {profile?.email_public
            ? `Contactez-moi à ${profile.email_public} ou via le formulaire.`
            : 'Contactez-moi via le formulaire de contact.'}
        </CtaText>
        <PrimaryBtn to="/contact">Me contacter</PrimaryBtn>
      </CtaBox>
    </>
  )
}
