import { useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import {
  useQuery,
  fetchProfile,
  fetchProjects,
  fetchWriteups,
  fetchCertifications,
  fetchTimeline,
} from '../lib/queries'
import { openAssistant } from '../lib/assistant'
import { isOn } from '../lib/modules'
import Terminal from '../components/Terminal'
import { Skeleton } from '../components/ui'
import { CardGrid, ProjectCard, RowList, WriteupRow, Reveal, Eyebrow } from '../components/cards'
import Hero, { PrimaryBtn, GhostBtn, SparkIcon } from '../components/home/Hero'
import Timeline from '../components/home/Timeline'
import Skills from '../components/home/Skills'

// ------------------------------------------------------------
// Chiffres clés
// ------------------------------------------------------------
const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`

const Stat = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.4rem 1.5rem;
  color: inherit;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 0.2s;

  &:last-child { border-right: none; }
  &:hover { color: inherit; background: ${({ theme }) => theme.colors.surfaceHover}; }

  strong {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: clamp(1.7rem, 4vw, 2.3rem);
    line-height: 1;
    background: ${({ theme }) => theme.colors.gradient};
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  span { font-size: 0.85rem; color: ${({ theme }) => theme.colors.muted}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { padding: 1rem; }
`

// ------------------------------------------------------------
// Sections
// ------------------------------------------------------------
const Section = styled.section`
  padding: 5rem 0 0;
  scroll-margin-top: 80px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { padding-top: 3.5rem; }
`

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
`

const SectionTitle = styled.h2`
  font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  font-weight: 700;
  margin-top: 0.35rem;
`

const SectionIntro = styled.p`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.muted};
  max-width: 56ch;
  line-height: 1.65;
`

const SeeAll = styled(Link)`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.blue};
  white-space: nowrap;

  &::after { content: ' →'; transition: margin 0.15s; }
  &:hover::after { margin-left: 4px; }
`

// ------------------------------------------------------------
// Certifications
// ------------------------------------------------------------
const CertGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`

const CertCard = styled.div<{ $obtained: boolean }>`
  height: 100%;
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1.1rem 1.2rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme, $obtained }) => ($obtained ? 'rgba(34, 229, 138, 0.35)' : theme.colors.border)};
  background: ${({ theme }) => theme.colors.surface};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover { transform: translateY(-3px); box-shadow: ${({ theme, $obtained }) => ($obtained ? theme.shadow.glowGreen : theme.shadow.glowBlue)}; }

  .icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: ${({ theme }) => theme.radius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme, $obtained }) => ($obtained ? theme.colors.green : theme.colors.blue)};
    background: ${({ theme, $obtained }) => ($obtained ? theme.colors.greenDim : theme.colors.blueDim)};
  }
  strong { display: block; }
  small { display: block; margin-top: 0.15rem; font-size: 0.82rem; color: ${({ theme }) => theme.colors.muted}; }
  a { display: inline-block; margin-top: 0.4rem; font-size: 0.8rem; color: ${({ theme }) => theme.colors.blue}; }
`

// ------------------------------------------------------------
// Terminal
// ------------------------------------------------------------
const TerminalSection = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 3rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
`

// ------------------------------------------------------------
// Appel à l'action
// ------------------------------------------------------------
const Cta = styled.section`
  margin-top: 5rem;
  padding: 2.75rem 2.5rem;
  border-radius: ${({ theme }) => theme.radius.xl};
  background:
    radial-gradient(500px 220px at 0% 0%, rgba(34, 229, 138, 0.16), transparent 70%),
    radial-gradient(500px 240px at 100% 100%, rgba(61, 139, 255, 0.18), transparent 70%),
    ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;

  h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 700; }
  p { color: ${({ theme }) => theme.colors.muted}; max-width: 50ch; margin-top: 0.5rem; line-height: 1.65; }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { padding: 2rem 1.25rem; }
`

const Buttons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function Home() {
  const { hash } = useLocation()
  const profileQ = useQuery(useCallback(() => fetchProfile(), []))
  const projectsQ = useQuery(useCallback(() => fetchProjects(), []))
  const writeupsQ = useQuery(useCallback(() => fetchWriteups(), []))
  const certsQ = useQuery(useCallback(() => fetchCertifications(), []))
  const timelineQ = useQuery(useCallback(() => fetchTimeline(), []))

  const profile = profileQ.status === 'success' ? profileQ.data : null
  const projects = projectsQ.status === 'success' ? projectsQ.data : []
  const writeups = writeupsQ.status === 'success' ? writeupsQ.data : []
  const certs = certsQ.status === 'success' ? certsQ.data : []
  const timeline = timelineQ.status === 'success' ? timelineQ.data : []
  const obtained = certs.filter(c => c.status === 'obtenue')
  const name = profile?.full_name || 'Carelle'

  const on = (key: string) => isOn(profile, key)
  const skills = profile?.skills ?? {}
  const hasSkills = Object.values(skills).some(list => list && list.length > 0)

  // Badges flottants du portrait : uniquement des faits issus des données
  const current = timeline.find(t => t.end_date === null)
  const badges = [
    current?.title,
    obtained.length > 0 ? `${obtained.length} certification${obtained.length > 1 ? 's' : ''}` : undefined,
    writeups.length > 0 ? `${writeups.length} write-up${writeups.length > 1 ? 's' : ''} CTF` : undefined,
    projects.length > 0 ? `${projects.length} projet${projects.length > 1 ? 's' : ''}` : undefined,
  ].filter((b): b is string => Boolean(b))

  // Arrivée depuis /a-propos ou un lien « /#parcours » : défiler jusqu'à la section
  const ready = profileQ.status !== 'loading' && timelineQ.status !== 'loading'
  useEffect(() => {
    if (!ready || !hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [ready, hash])

  const termData = { profile, projects, writeups, certifications: certs }

  return (
    <>
      <Helmet><title>{`${name} · Cybersécurité`}</title></Helmet>

      <Hero profile={profile} badges={badges} />

      {on('stats') && projectsQ.status === 'success' && writeupsQ.status === 'success' && (
        <Reveal>
          <Stats>
            {on('projects') && <Stat to="/projets"><strong>{projects.length}</strong><span>projets</span></Stat>}
            {on('blog') && <Stat to="/blog"><strong>{writeups.length}</strong><span>articles &amp; write-ups</span></Stat>}
            {on('certifications') && <Stat to="/#certifications"><strong>{obtained.length}</strong><span>certifications</span></Stat>}
            {on('parcours') && timeline.length > 0 && (
              <Stat to="/#parcours"><strong>{timeline.length}</strong><span>étapes de parcours</span></Stat>
            )}
          </Stats>
        </Reveal>
      )}

      {on('parcours') && timeline.length > 0 && (
        <Section id="parcours" aria-labelledby="parcours-title">
          <Reveal>
            <Eyebrow>~/parcours</Eyebrow>
            <SectionTitle id="parcours-title">Mon parcours</SectionTitle>
            <SectionIntro>Formations et expériences qui m'ont amenée à la cybersécurité. Cliquez sur une étape pour en voir le détail.</SectionIntro>
          </Reveal>
          <div style={{ marginTop: '2rem' }}>
            <Timeline entries={timeline} />
          </div>
        </Section>
      )}

      {on('skills') && hasSkills && (
        <Section id="competences" aria-labelledby="skills-title">
          <Reveal>
            <SectionHeader>
              <div>
                <Eyebrow>ce que je sais faire</Eyebrow>
                <SectionTitle id="skills-title">Compétences</SectionTitle>
              </div>
            </SectionHeader>
          </Reveal>
          <Reveal><Skills skills={skills} /></Reveal>
        </Section>
      )}

      {on('certifications') && certs.length > 0 && (
        <Section id="certifications" aria-labelledby="certs-title">
          <Reveal>
            <SectionHeader>
              <div>
                <Eyebrow>ce qui le prouve</Eyebrow>
                <SectionTitle id="certs-title">Certifications</SectionTitle>
              </div>
            </SectionHeader>
          </Reveal>
          <CertGrid>
            {certs.map((c, i) => {
              const ok = c.status === 'obtenue'
              return (
                <Reveal key={c.id} delay={i * 0.06}>
                  <CertCard $obtained={ok}>
                    <span className="icon" aria-hidden="true">{ok ? '✓' : '◷'}</span>
                    <div>
                      <strong>{c.name}</strong>
                      <small>{c.issuer}{ok && c.obtained_at ? ` · ${fmtMonth(c.obtained_at)}` : ok ? '' : ' · en cours'}</small>
                      {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener noreferrer">Vérifier ↗</a>}
                    </div>
                  </CertCard>
                </Reveal>
              )
            })}
          </CertGrid>
        </Section>
      )}

      {on('projects') && (projectsQ.status === 'loading' || projects.length > 0) && (
        <Section aria-labelledby="projects-title">
          <Reveal>
            <SectionHeader>
              <div>
                <Eyebrow>ce que j'ai construit</Eyebrow>
                <SectionTitle id="projects-title">Projets à la une</SectionTitle>
              </div>
              <SeeAll to="/projets">Tous les projets</SeeAll>
            </SectionHeader>
          </Reveal>
          {projectsQ.status === 'loading'
            ? <Skeleton $h="16rem" $radius="16px" />
            : (
              <CardGrid>
                {projects.slice(0, 3).map((p, i) => (
                  <Reveal key={p.slug} delay={i * 0.08}><ProjectCard project={p} maxTags={3} /></Reveal>
                ))}
              </CardGrid>
            )}
        </Section>
      )}

      {on('blog') && writeups.length > 0 && (
        <Section aria-labelledby="blog-title">
          <Reveal>
            <SectionHeader>
              <div>
                <Eyebrow>comment je raisonne</Eyebrow>
                <SectionTitle id="blog-title">Derniers articles</SectionTitle>
              </div>
              <SeeAll to="/blog">Tout le blog</SeeAll>
            </SectionHeader>
          </Reveal>
          <RowList>
            {writeups.slice(0, 3).map((w, i) => (
              <Reveal key={w.slug} delay={i * 0.06}><WriteupRow writeup={w} /></Reveal>
            ))}
          </RowList>
        </Section>
      )}

      {on('terminal') && (
        <Section aria-labelledby="terminal-title">
          <TerminalSection>
            <Reveal>
              <Eyebrow>pour les curieux</Eyebrow>
              <SectionTitle id="terminal-title">Explorez en ligne de commande</SectionTitle>
              <SectionIntro>
                Tapez <code>help</code>, <code>whoami</code> ou <code>ls projets</code> dans le terminal, ou cliquez sur une commande.
              </SectionIntro>
            </Reveal>
            <Reveal delay={0.1}>
              <Terminal data={termData} autoplay={profileQ.status !== 'loading'} />
            </Reveal>
          </TerminalSection>
        </Section>
      )}

      <Reveal>
        <Cta aria-labelledby="cta-heading">
          <div>
            <h2 id="cta-heading">Un stage, une alternance, un projet ?</h2>
            <p>Écrivez-moi, je réponds rapidement.{on('assistant') && ' Pour une question rapide sur mon parcours, mon assistant répond tout de suite.'}</p>
          </div>
          <Buttons>
            <PrimaryBtn to="/contact">Me contacter</PrimaryBtn>
            {on('assistant') && (
              <GhostBtn type="button" onClick={() => openAssistant()}><SparkIcon /> Demander à l'assistant</GhostBtn>
            )}
          </Buttons>
        </Cta>
      </Reveal>
    </>
  )
}
