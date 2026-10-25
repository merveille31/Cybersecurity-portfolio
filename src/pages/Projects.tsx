import { useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, fetchProjects } from '../lib/queries'
import { Skeleton, EmptyState, ErrorMessage } from '../components/ui'
import { PageHeader, CardGrid, ProjectCard, Reveal } from '../components/cards'

function SkeletonGrid() {
  return (
    <CardGrid>
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
    </CardGrid>
  )
}

export default function Projects() {
  const query = useQuery(useCallback(() => fetchProjects(), []))

  return (
    <>
      <Helmet><title>Projets · Carelle</title></Helmet>
      <PageHeader
        eyebrow="~/projets"
        title="Projets"
        intro="Outils, labs et réalisations en sécurité : ce que j'ai construit, comment, et ce que j'en ai appris."
      />

      {query.status === 'loading' && <SkeletonGrid />}
      {query.status === 'error' && <ErrorMessage message={query.error} />}
      {query.status === 'success' && query.data.length === 0 && (
        <EmptyState message="Aucun projet publié pour l'instant." />
      )}
      {query.status === 'success' && query.data.length > 0 && (
        <CardGrid>
          {query.data.map((project, i) => (
            <Reveal key={project.slug} delay={Math.min(i, 5) * 0.06}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </CardGrid>
      )}
    </>
  )
}
