import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import { useQuery, fetchWriteups } from '../lib/queries'
import { Skeleton, EmptyState, ErrorMessage } from '../components/ui'
import { PageHeader, RowList, WriteupRow, Reveal } from '../components/cards'
import type { WriteupCategory, WriteupDifficulty } from '../types/database'

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 1.5rem;
  align-items: center;
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 180px;
  padding: 0.6rem 0.9rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.875rem;

  &::placeholder { color: ${({ theme }) => theme.colors.muted}; }
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.blue};
    outline-offset: 1px;
    border-color: transparent;
  }
`

const Select = styled.select`
  padding: 0.6rem 0.9rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.blue};
    outline-offset: 1px;
  }
`

const ResetBtn = styled.button`
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`

const CATEGORIES: WriteupCategory[] = [
  'web','pwn','forensics','crypto','reverse','osint','réseau','autre',
]
const DIFFICULTIES: WriteupDifficulty[] = ['facile','moyen','difficile','insane']

function SkeletonList() {
  return (
    <RowList>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ padding: '1rem 1.25rem', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton $h="1rem" $w="55%" />
          <Skeleton $h="0.8rem" $w="40%" />
        </div>
      ))}
    </RowList>
  )
}

export default function Writeups() {
  const [params, setParams] = useSearchParams()
  const query = useQuery(useCallback(() => fetchWriteups(), []))

  const search   = params.get('q') ?? ''
  const category = params.get('cat') ?? ''
  const difficulty = params.get('diff') ?? ''
  const platform = params.get('platform') ?? ''

  const set = useCallback((key: string, value: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }, [setParams])

  const reset = useCallback(() => setParams({}, { replace: true }), [setParams])

  const platforms = useMemo(() => {
    if (query.status !== 'success') return []
    return [...new Set(query.data.map(w => w.platform).filter(Boolean))].sort()
  }, [query])

  const filtered = useMemo(() => {
    if (query.status !== 'success') return []
    const q = search.toLowerCase()
    return query.data.filter(w => {
      if (category && w.category !== category) return false
      if (difficulty && w.difficulty !== difficulty) return false
      if (platform && w.platform !== platform) return false
      if (q && !w.title.toLowerCase().includes(q) && !w.tags.some(t => t.toLowerCase().includes(q))) return false
      return true
    })
  }, [query, search, category, difficulty, platform])

  const hasFilters = search || category || difficulty || platform

  return (
    <>
      <Helmet><title>Write-ups CTF · Carelle</title></Helmet>
      <PageHeader
        eyebrow="~/writeups"
        title="Write-ups CTF"
        intro="Mes résolutions de challenges de sécurité (CTF), étape par étape : la démarche, les outils, les erreurs et la solution."
      />

      <Controls>
        <SearchInput
          type="search"
          placeholder="Rechercher un challenge, un outil, une technique…"
          value={search}
          onChange={e => set('q', e.target.value)}
          aria-label="Rechercher un write-up"
        />
        <Select value={category} onChange={e => set('cat', e.target.value)} aria-label="Catégorie">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={difficulty} onChange={e => set('diff', e.target.value)} aria-label="Difficulté">
          <option value="">Toutes difficultés</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </Select>
        {platforms.length > 0 && (
          <Select value={platform} onChange={e => set('platform', e.target.value)} aria-label="Plateforme">
            <option value="">Toutes plateformes</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        )}
        {hasFilters && <ResetBtn onClick={reset}>✕ Réinitialiser</ResetBtn>}
      </Controls>

      {query.status === 'loading' && <SkeletonList />}
      {query.status === 'error' && <ErrorMessage message={query.error} />}
      {query.status === 'success' && filtered.length === 0 && (
        <EmptyState message={hasFilters ? 'Aucun résultat pour ces filtres.' : 'Aucun write-up publié pour l\'instant.'} />
      )}
      {query.status === 'success' && filtered.length > 0 && (
        <RowList>
          {filtered.map((w, i) => (
            <Reveal key={w.slug} delay={Math.min(i, 5) * 0.05}>
              <WriteupRow writeup={w} showTags />
            </Reveal>
          ))}
        </RowList>
      )}
    </>
  )
}
