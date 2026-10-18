import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import { useQuery, fetchProjects } from '../lib/queries'
import { Skeleton, Tag, EmptyState, ErrorMessage } from '../components/ui'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
`

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  text-decoration: none;
  transition: border-color 0.2s;

  &:hover { border-color: ${({ theme }) => theme.colors.violet}66; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.violet};
    outline-offset: 2px;
  }
`

const Cover = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
`

const CoverPlaceholder = styled.div`
  width: 100%;
  height: 160px;
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
`

const Body = styled.div`
  padding: 1rem 1.125rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Title = styled.h2`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const Summary = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.55;
  flex: 1;
`

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
`

const FeaturedDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.magenta};
  margin-right: 0.4rem;
  vertical-align: middle;
`

function SkeletonGrid() {
  return (
    <Grid>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ borderRadius: 16, overflow: 'hidden' }}>
          <Skeleton $h="160px" $radius="0" />
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton $h="1rem" $w="60%" />
            <Skeleton $h="0.8rem" />
            <Skeleton $h="0.8rem" $w="80%" />
          </div>
        </div>
      ))}
    </Grid>
  )
}

export default function Projects() {
  const query = useQuery(useCallback(() => fetchProjects(), []))

  return (
    <>
      <Helmet><title>Projets · Carelle</title></Helmet>
      <h1>Projets</h1>

      {query.status === 'loading' && <SkeletonGrid />}
      {query.status === 'error' && <ErrorMessage message={query.error} />}
      {query.status === 'success' && query.data.length === 0 && (
        <EmptyState message="Aucun projet publié pour l'instant." />
      )}
      {query.status === 'success' && query.data.length > 0 && (
        <Grid>
          {query.data.map(project => (
            <Card key={project.slug} to={`/projets/${project.slug}`}>
              {project.cover_url
                ? <Cover src={project.cover_url} alt={project.title} loading="lazy" />
                : <CoverPlaceholder>~/projets/{project.slug}</CoverPlaceholder>
              }
              <Body>
                <Title>
                  {project.featured && <FeaturedDot aria-label="mis en avant" />}
                  {project.title}
                </Title>
                {project.summary && <Summary>{project.summary}</Summary>}
                {project.tags.length > 0 && (
                  <Tags>{project.tags.map(t => <Tag key={t}>{t}</Tag>)}</Tags>
                )}
              </Body>
            </Card>
          ))}
        </Grid>
      )}
    </>
  )
}
