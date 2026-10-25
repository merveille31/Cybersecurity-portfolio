import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { Badge, CategoryBadge, Tag } from './ui'
import type { Project, Writeup } from '../types/database'

// Briques visuelles partagées par l'accueil et les pages de liste.

// ------------------------------------------------------------
// Apparition au défilement (désactivée si l'utilisateur réduit les animations,
// via <MotionConfig reducedMotion="user"> dans main.tsx)
// ------------------------------------------------------------
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ------------------------------------------------------------
// En-tête de page
// ------------------------------------------------------------
const HeaderWrap = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 2rem;
`

export const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.green};
  letter-spacing: 0.02em;
`

const PageTitle = styled.h1`
  font-size: clamp(1.9rem, 4.5vw, 2.75rem);
  font-weight: 700;
`

const Intro = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 1rem;
  line-height: 1.7;
  max-width: 62ch;
`

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: ReactNode }) {
  return (
    <HeaderWrap>
      <Eyebrow>{eyebrow}</Eyebrow>
      <PageTitle>{title}</PageTitle>
      {intro && <Intro>{intro}</Intro>}
    </HeaderWrap>
  )
}

// ------------------------------------------------------------
// Carte projet
// ------------------------------------------------------------
export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
`

const ProjectLink = styled(Link)`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  color: inherit;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    color: inherit;
    transform: translateY(-4px);
    border-color: rgba(34, 229, 138, 0.45);
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
  }
  &:hover img { transform: scale(1.04); }

  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; }
    &:hover img { transform: none; }
  }
`

const CoverBox = styled.div`
  position: relative;
  height: 160px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
`

// Couverture par défaut : grille fine + halo vert/bleu + chemin du projet
const CoverPlaceholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 0.9rem 1rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
  background:
    radial-gradient(260px 140px at 15% 0%, rgba(34, 229, 138, 0.28), transparent 70%),
    radial-gradient(260px 160px at 100% 100%, rgba(61, 139, 255, 0.3), transparent 70%),
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 22px 22px,
    ${({ theme }) => theme.colors.bg};

  span { color: ${({ theme }) => theme.colors.green}; margin-right: 0.35rem; }
`

const FeaturedFlag = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.66rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.onAccent};
  background: ${({ theme }) => theme.colors.green};
`

const CardBody = styled.div`
  padding: 1rem 1.15rem 1.15rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const CardTitle = styled.h3`
  font-size: 1.02rem;
  font-weight: 600;
`

const CardSummary = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.6;
  flex: 1;
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
`

export function ProjectCard({ project, maxTags = 4 }: { project: Project; maxTags?: number }) {
  const [coverFailed, setCoverFailed] = useState(false)
  return (
    <ProjectLink to={`/projets/${project.slug}`}>
      <CoverBox>
        {project.cover_url && !coverFailed
          ? <img src={project.cover_url} alt="" loading="lazy" onError={() => setCoverFailed(true)} />
          : <CoverPlaceholder aria-hidden="true"><span>$</span>cd ~/projets/{project.slug}</CoverPlaceholder>}
        {project.featured && <FeaturedFlag>à la une</FeaturedFlag>}
      </CoverBox>
      <CardBody>
        <CardTitle>{project.title}</CardTitle>
        {project.summary && <CardSummary>{project.summary}</CardSummary>}
        {project.tags.length > 0 && (
          <TagRow>{project.tags.slice(0, maxTags).map(t => <Tag key={t}>{t}</Tag>)}</TagRow>
        )}
      </CardBody>
    </ProjectLink>
  )
}

// ------------------------------------------------------------
// Ligne write-up
// ------------------------------------------------------------
export const RowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const WriteupLink = styled(Link)`
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1rem;
  align-items: center;
  padding: 1rem 1.25rem 1rem 1.4rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: inherit;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;

  /* Liseré dégradé qui apparaît au survol */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ theme }) => theme.colors.gradient};
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    color: inherit;
    border-color: rgba(61, 139, 255, 0.45);
    background: ${({ theme }) => theme.colors.surfaceHover};
    transform: translateX(3px);
  }
  &:hover::before { opacity: 1; }

  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`

const WriteupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
`

const WriteupMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.muted};
`

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function WriteupRow({ writeup, showTags = false }: { writeup: Writeup; showTags?: boolean }) {
  return (
    <WriteupLink to={`/blog/${writeup.slug}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }}>
        <WriteupTitle>{writeup.title}</WriteupTitle>
        <WriteupMeta>
          <CategoryBadge>{writeup.category}</CategoryBadge>
          {writeup.platform && <span>{writeup.platform}</span>}
          {writeup.published_at && <span>· {formatDate(writeup.published_at)}</span>}
        </WriteupMeta>
        {showTags && writeup.tags.length > 0 && (
          <TagRow>{writeup.tags.map(t => <Tag key={t}>{t}</Tag>)}</TagRow>
        )}
      </div>
      <div><Badge $value={writeup.difficulty}>{writeup.difficulty}</Badge></div>
    </WriteupLink>
  )
}
