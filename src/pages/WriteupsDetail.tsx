import { useCallback, useMemo } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import { useQuery, fetchWriteupBySlug } from '../lib/queries'
import BlockRenderer from '../components/BlockRenderer'
import { Skeleton, Badge, CategoryBadge, Tag, ErrorMessage } from '../components/ui'
import type { ContentBlock } from '../types/database'

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
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
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.muted};
`

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`

const TocBox = styled.nav`
  position: sticky;
  top: 72px;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.8rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    order: -1;
  }
`

const TocTitle = styled.p`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const TocList = styled.ol`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`

const TocItem = styled.li<{ $level: number }>`
  padding-left: ${({ $level }) => ($level - 2) * 0.75}rem;

  a {
    color: ${({ theme }) => theme.colors.muted};
    text-decoration: none;
    transition: color 0.15s;
    &:hover { color: ${({ theme }) => theme.colors.blue}; }
  }
`

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Extrait les titres ## et ### du Markdown des blocs text
type TocEntry = { level: number; text: string; id: string }

function extractToc(blocks: ContentBlock[]): TocEntry[] {
  const entries: TocEntry[] = []
  const headingRe = /^(#{2,3})\s+(.+)$/gm

  for (const block of blocks) {
    if (block.type !== 'text') continue
    let m: RegExpExecArray | null
    while ((m = headingRe.exec(block.value)) !== null) {
      const level = m[1].length
      const text = m[2].trim()
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      entries.push({ level, text, id })
    }
  }
  return entries
}

// Compte les mots dans tous les blocs text
function countWords(blocks: ContentBlock[]): number {
  return blocks
    .filter(b => b.type === 'text' || b.type === 'code')
    .reduce((acc, b) => acc + (b as { value: string }).value.split(/\s+/).length, 0)
}

function readingTime(blocks: ContentBlock[]): string {
  const words = countWords(blocks)
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min de lecture`
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ------------------------------------------------------------
// Skeleton
// ------------------------------------------------------------
function SkeletonDetail() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton $h="0.875rem" $w="80px" />
      <Skeleton $h="2rem" $w="65%" />
      <Skeleton $h="0.8rem" $w="40%" />
      <Skeleton $h="1rem" />
      <Skeleton $h="1rem" $w="90%" />
      <Skeleton $h="1rem" $w="80%" />
    </div>
  )
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function WriteupsDetail() {
  const { slug } = useParams<{ slug: string }>()
  const query = useQuery(useCallback(() => fetchWriteupBySlug(slug!), [slug]))

  const toc = useMemo(
    () => (query.status === 'success' && query.data ? extractToc(query.data.content) : []),
    [query],
  )

  if (query.status === 'loading') return <SkeletonDetail />
  if (query.status === 'error') return <ErrorMessage message={query.error} />
  if (query.status === 'success' && query.data === null) return <Navigate to="/404" replace />

  const wu = query.data!

  return (
    <>
      <Helmet><title>{wu.title} · Write-up · Carelle</title></Helmet>

      <BackLink to="/writeups">← Write-ups</BackLink>

      <Header>
        <h1>{wu.title}</h1>
        <MetaRow>
          <CategoryBadge>{wu.category}</CategoryBadge>
          <Badge $value={wu.difficulty}>{wu.difficulty}</Badge>
          {wu.platform && <span>{wu.platform}</span>}
          {wu.published_at && <span>{formatDate(wu.published_at)}</span>}
          <span>{readingTime(wu.content)}</span>
        </MetaRow>
        {wu.tags.length > 0 && (
          <Tags>{wu.tags.map(t => <Tag key={t}>{t}</Tag>)}</Tags>
        )}
        {wu.summary && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>{wu.summary}</p>
        )}
      </Header>

      <Layout>
        <div>
          <BlockRenderer blocks={wu.content} />
        </div>

        {toc.length > 0 && (
          <TocBox aria-label="Sommaire">
            <TocTitle>Sommaire</TocTitle>
            <TocList>
              {toc.map((entry, i) => (
                <TocItem key={i} $level={entry.level}>
                  <a href={`#${entry.id}`}>{entry.text}</a>
                </TocItem>
              ))}
            </TocList>
          </TocBox>
        )}
      </Layout>
    </>
  )
}
