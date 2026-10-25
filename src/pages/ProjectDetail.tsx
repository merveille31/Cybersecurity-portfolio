import { useCallback } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import { useQuery, fetchProjectBySlug } from '../lib/queries'
import BlockRenderer from '../components/BlockRenderer'
import { Skeleton, Tag, ErrorMessage } from '../components/ui'

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`

const Header = styled.div`
  margin-bottom: 2rem;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0.75rem;
`

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.2s, color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue};
    color: ${({ theme }) => theme.colors.blue};
  }
`

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`

const Cover = styled.img`
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 2rem;
`

function SkeletonDetail() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton $h="0.875rem" $w="80px" />
      <Skeleton $h="2rem" $w="60%" />
      <Skeleton $h="160px" />
      <Skeleton $h="1rem" />
      <Skeleton $h="1rem" $w="90%" />
      <Skeleton $h="1rem" $w="75%" />
    </div>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const query = useQuery(useCallback(() => fetchProjectBySlug(slug!), [slug]))

  if (query.status === 'loading') return <SkeletonDetail />
  if (query.status === 'error') return <ErrorMessage message={query.error} />
  if (query.status === 'success' && query.data === null) return <Navigate to="/404" replace />

  const project = query.data!

  return (
    <>
      <Helmet><title>{project.title} · Projets · Carelle</title></Helmet>

      <BackLink to="/projets">← Projets</BackLink>

      <Header>
        <h1>{project.title}</h1>
        <Meta>
          {project.repo_url && (
            <ExternalLink href={project.repo_url} target="_blank" rel="noopener noreferrer">
              ↗ Dépôt
            </ExternalLink>
          )}
          {project.demo_url && (
            <ExternalLink href={project.demo_url} target="_blank" rel="noopener noreferrer">
              ↗ Démo
            </ExternalLink>
          )}
          {project.tags.length > 0 && (
            <Tags>{project.tags.map(t => <Tag key={t}>{t}</Tag>)}</Tags>
          )}
        </Meta>
        {project.summary && (
          <p style={{ marginTop: '0.75rem', color: 'inherit' }}>{project.summary}</p>
        )}
      </Header>

      {project.cover_url && (
        <Cover src={project.cover_url} alt={project.title} loading="lazy" />
      )}

      <BlockRenderer blocks={project.content} />
    </>
  )
}
