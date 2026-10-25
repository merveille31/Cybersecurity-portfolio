import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import {
  useQuery,
  fetchProfile,
  fetchProjects,
  fetchWriteups,
  fetchCertifications,
} from '../lib/queries'
import { openAssistant } from '../lib/assistant'
import Terminal from '../components/Terminal'
import { Skeleton } from '../components/ui'
import { CardGrid, ProjectCard, RowList, WriteupRow, Reveal, Eyebrow } from '../components/cards'
import { SocialLinks } from '../components/ProfileLinks'

// ------------------------------------------------------------
// Héros
// ------------------------------------------------------------
const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 3.5rem;
  align-items: center;
  padding: 3rem 0 4.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
    padding: 1.5rem 0 3rem;
  }
`

const HeroText = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
`

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.85rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid rgba(34, 229, 138, 0.3);
  background: ${({ theme }) => theme.colors.greenDim};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text};

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.green};
    box-shadow: 0 0 0 4px rgba(34, 229, 138, 0.2);
  }
`

const HeroTitle = styled.h1`
  font-size: clamp(2.6rem, 7vw, 4.5rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.035em;

  .name {
    background: ${({ theme }) => theme.colors.gradient};
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
`

const HeroSub = styled.p`
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.6;
  max-width: 46ch;
`

const Buttons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
`

const PrimaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.4rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.green};
  color: ${({ theme }) => theme.colors.onAccent};
  font-weight: 600;
  font-size: 0.95rem;
  transition: background 0.15s, box-shadow 0.2s, transform 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.greenHover};
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
    transform: translateY(-2px);
  }
  &:active { background: ${({ theme }) => theme.colors.greenPressed}; transform: none; }
`

const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.3rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue};
    background: ${({ theme }) => theme.colors.blueDim};
  }
`

const SparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
  </svg>
)

const TerminalWrap = styled(motion.div)`
  min-width: 0;
`

// ------------------------------------------------------------
// Chiffres clés
// ------------------------------------------------------------
const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  transition: background 0.2s;

  & + & { border-left: 1px solid ${({ theme }) => theme.colors.border}; }
  &:hover { color: inherit; background: ${({ theme }) => theme.colors.surfaceHover}; }

  strong {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    line-height: 1;
    background: ${({ theme }) => theme.colors.gradient};
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  span { font-size: 0.85rem; color: ${({ theme }) => theme.colors.muted}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1rem;
  }
`

// ------------------------------------------------------------
// Sections
// ------------------------------------------------------------
const Section = styled.section`
  padding: 4rem 0 0;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const SectionTitle = styled.h2`
  font-size: clamp(1.4rem, 3vw, 1.85rem);
  font-weight: 700;
  margin-top: 0.35rem;
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

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2rem 1.25rem;
  }
`

const CtaTitle = styled.h2`
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 700;
`

const CtaText = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  max-width: 50ch;
  margin-top: 0.5rem;
  line-height: 1.65;
`

// ------------------------------------------------------------
// Squelettes
// ------------------------------------------------------------
function ProjectSkeleton() {
  return (
    <CardGrid>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ borderRadius: 16, overflow: 'hidden' }}>
          <Skeleton $h="160px" $radius="0" />
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton $h="1rem" $w="55%" />
            <Skeleton $h="0.8rem" />
          </div>
        </div>
      ))}
    </CardGrid>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
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
  const allProjects = projectsQ.status === 'success' ? projectsQ.data : []
  const allWriteups = writeupsQ.status === 'success' ? writeupsQ.data : []
  const certs = certsQ.status === 'success' ? certsQ.data : []
  const obtained = certs.filter(c => c.status === 'obtenue').length

  const termData = { profile, projects: allProjects, writeups: allWriteups, certifications: certs }
  const name = profile?.full_name || 'Carelle'

  return (
    <>
      <Helmet><title>{`${name} · Cybersécurité`}</title></Helmet>

      <Hero>
        <HeroText initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><Status>Cybersécurité · offensive &amp; défensive</Status></motion.div>
          <motion.div variants={fadeUp}>
            <HeroTitle>
              Bonjour, je suis <span className="name">{name}</span>.
            </HeroTitle>
          </motion.div>
          <motion.div variants={fadeUp}>
            <HeroSub>
              {profile?.headline
                ? profile.headline
                : 'Étudiante en cybersécurité, je casse des systèmes pour apprendre à mieux les protéger.'}
            </HeroSub>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Buttons>
              <PrimaryBtn to="/projets">Voir mes projets</PrimaryBtn>
              <GhostBtn type="button" onClick={() => openAssistant()}>
                <SparkIcon /> Poser une question à mon assistant
              </GhostBtn>
            </Buttons>
          </motion.div>
          {profile && (
            <motion.div variants={fadeUp}>
              <SocialLinks links={profile.links} />
            </motion.div>
          )}
        </HeroText>

        <TerminalWrap
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* L'animation "whoami" attend le profil pour ne pas afficher "non disponible" */}
          <Terminal data={termData} autoplay={profileQ.status !== 'loading'} />
        </TerminalWrap>
      </Hero>

      {projectsQ.status === 'success' && writeupsQ.status === 'success' && certsQ.status === 'success' && (
        <Reveal>
          <Stats>
            <Stat to="/projets"><strong>{allProjects.length}</strong><span>projets</span></Stat>
            <Stat to="/writeups"><strong>{allWriteups.length}</strong><span>write-ups CTF</span></Stat>
            <Stat to="/a-propos"><strong>{obtained}</strong><span>certifications</span></Stat>
          </Stats>
        </Reveal>
      )}

      <Section aria-labelledby="featured-projects">
        <Reveal>
          <SectionHeader>
            <div>
              <Eyebrow>ce que j'ai construit</Eyebrow>
              <SectionTitle id="featured-projects">Projets à la une</SectionTitle>
            </div>
            <SeeAll to="/projets">Tous les projets</SeeAll>
          </SectionHeader>
        </Reveal>
        {projectsQ.status === 'loading' && <ProjectSkeleton />}
        {allProjects.length > 0 && (
          <CardGrid>
            {allProjects.slice(0, 3).map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}><ProjectCard project={p} maxTags={3} /></Reveal>
            ))}
          </CardGrid>
        )}
      </Section>

      <Section aria-labelledby="recent-writeups">
        <Reveal>
          <SectionHeader>
            <div>
              <Eyebrow>comment je raisonne</Eyebrow>
              <SectionTitle id="recent-writeups">Derniers write-ups CTF</SectionTitle>
            </div>
            <SeeAll to="/writeups">Tous les write-ups</SeeAll>
          </SectionHeader>
        </Reveal>
        {writeupsQ.status === 'loading' && <Skeleton $h="12rem" $radius="16px" />}
        {allWriteups.length > 0 && (
          <RowList>
            {allWriteups.slice(0, 3).map((w, i) => (
              <Reveal key={w.slug} delay={i * 0.06}><WriteupRow writeup={w} /></Reveal>
            ))}
          </RowList>
        )}
      </Section>

      <Reveal>
        <Cta aria-labelledby="cta-heading">
          <div>
            <CtaTitle id="cta-heading">Un stage, une alternance, un projet ?</CtaTitle>
            <CtaText>
              Écrivez-moi : je réponds rapidement. Et si vous voulez juste en savoir plus sur mon parcours,
              mon assistant peut vous répondre tout de suite.
            </CtaText>
          </div>
          <Buttons>
            <PrimaryBtn to="/contact">Me contacter</PrimaryBtn>
            <GhostBtn type="button" onClick={() => openAssistant()}><SparkIcon /> Demander à l'assistant</GhostBtn>
          </Buttons>
        </Cta>
      </Reveal>
    </>
  )
}
