import { useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence, useScroll, useSpring, LayoutGroup } from 'framer-motion'
import styled from 'styled-components'
import { KIND_LABELS, formatPeriod } from '../../lib/timeline'
import { Tag } from '../ui'
import type { TimelineEntry, TimelineKind } from '../../types/database'

// Frise interactive du parcours :
// - la ligne centrale se remplit au fil du défilement,
// - filtres par type (formation, expérience…),
// - chaque étape s'ouvre au clic pour révéler le détail.

// Icônes en SVG (les emojis s'affichent mal sur certains systèmes)
const ICON_PATHS: Record<TimelineKind, string> = {
  formation:     'M2 9l10-5 10 5-10 5L2 9Zm4 2.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5',
  experience:    'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  certification: 'M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3Z',
  projet:        'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z',
  engagement:    'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9c0-3 2.7-5 6-5s6 2 6 5m0-5c.6-.2 1.3-.3 2-.3 3.3 0 6 2 6 5',
  autre:         'M12 3v18M3 12h18',
}

function KindIcon({ kind }: { kind: TimelineKind }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[kind]} />
    </svg>
  )
}

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 2.5rem;
`

const FilterBtn = styled.button<{ $active: boolean }>`
  position: relative;
  padding: 0.45rem 1rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  /* Fond posé aussi sur le bouton : le texte reste lisible même sans la pastille animée */
  background: ${({ theme, $active }) => ($active ? theme.colors.gradient : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.onAccent : theme.colors.muted)};
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;

  span { position: relative; z-index: 1; }
  &:hover { color: ${({ theme, $active }) => ($active ? theme.colors.onAccent : theme.colors.text)}; }
`

const FilterPill = styled(motion.span)`
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.gradient};
`

const Track = styled.div`
  position: relative;
  padding: 0.5rem 0;
`

// Rail gris + remplissage dégradé piloté par le défilement
const Rail = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    left: 15px;
  }
`

const RailFill = styled(motion.div)`
  position: absolute;
  inset: 0;
  transform-origin: top;
  background: linear-gradient(to bottom, #22E58A, #17D0D8, #3D8BFF);
  box-shadow: 0 0 12px rgba(34, 229, 138, 0.7);
`

const Row = styled(motion.div)<{ $side: 'left' | 'right' }>`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.5rem;
  margin-bottom: 1.75rem;

  > .card { grid-column: ${({ $side }) => ($side === 'left' ? 1 : 2)}; }
  > .date {
    grid-column: ${({ $side }) => ($side === 'left' ? 2 : 1)};
    grid-row: 1;
    justify-self: ${({ $side }) => ($side === 'left' ? 'start' : 'end')};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 0.4rem;
    padding-left: 2.6rem;

    > .card, > .date { grid-column: 1; justify-self: start; }
    > .date { grid-row: 1; }
  }
`

const Node = styled(motion.span)<{ $current: boolean }>`
  position: absolute;
  top: 1.35rem;
  left: 50%;
  z-index: 1;
  width: 34px;
  height: 34px;
  margin-left: -17px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: ${({ theme, $current }) => ($current ? theme.colors.green : theme.colors.blue)};
  background: ${({ theme }) => theme.colors.bg};
  border: 2px solid ${({ theme, $current }) => ($current ? theme.colors.green : theme.colors.blue)};
  box-shadow: 0 0 0 5px ${({ theme }) => theme.colors.bg},
    0 0 18px ${({ $current }) => ($current ? 'rgba(34, 229, 138, 0.6)' : 'rgba(61, 139, 255, 0.45)')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    left: 16px;
    top: 0.2rem;
    width: 30px;
    height: 30px;
    margin-left: -15px;
    font-size: 0.8rem;
  }
`

const DateLabel = styled.div`
  padding-top: 1.55rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.muted};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding-top: 0.3rem;
  }
`

const Card = styled(motion.button)<{ $open: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 1.15rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme, $open }) => ($open ? 'rgba(34, 229, 138, 0.55)' : theme.colors.border)};
  background: ${({ theme, $open }) => ($open ? theme.colors.surfaceHover : theme.colors.surface)};
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  box-shadow: ${({ theme, $open }) => ($open ? theme.shadow.glowGreen : 'none')};

  &:hover { border-color: rgba(61, 139, 255, 0.55); }
`

const Kind = styled.span`
  display: inline-block;
  margin-bottom: 0.4rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.green};
`

const CardTitle = styled.h3`
  font-size: 1.08rem;
  font-weight: 700;
`

const Org = styled.p`
  margin-top: 0.2rem;
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.muted};
`

const More = styled.span<{ $open: boolean }>`
  display: inline-block;
  margin-top: 0.6rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.blue};

  &::after {
    content: '▾';
    display: inline-block;
    margin-left: 0.3rem;
    transition: transform 0.2s;
    transform: rotate(${({ $open }) => ($open ? '180deg' : '0')});
  }
`

const Details = styled(motion.div)`
  overflow: hidden;

  .inner { padding-top: 0.8rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .desc { font-size: 0.9rem; line-height: 1.7; color: ${({ theme }) => theme.colors.muted}; }
  .desc p + p { margin-top: 0.5rem; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
`

function Entry({ entry, side, index }: { entry: TimelineEntry; side: 'left' | 'right'; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const current = entry.end_date === null
  const hasDetails = Boolean(entry.description || entry.tags.length)

  return (
    <Row
      $side={side}
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Node
        $current={current}
        aria-hidden="true"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
      >
        <KindIcon kind={entry.kind} />
      </Node>

      <div className="card">
        <Card
          type="button"
          $open={open}
          aria-expanded={hasDetails ? open : undefined}
          onClick={() => hasDetails && setOpen(o => !o)}
          whileHover={{ y: -3 }}
          style={{ cursor: hasDetails ? 'pointer' : 'default' }}
        >
          <Kind>{KIND_LABELS[entry.kind]}{current ? ' · en cours' : ''}</Kind>
          <CardTitle>{entry.title}</CardTitle>
          {(entry.organization || entry.location) && (
            <Org>{[entry.organization, entry.location].filter(Boolean).join(' · ')}</Org>
          )}
          <AnimatePresence initial={false}>
            {open && hasDetails && (
              <Details
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="inner">
                  {entry.description && <div className="desc"><ReactMarkdown>{entry.description}</ReactMarkdown></div>}
                  {entry.tags.length > 0 && (
                    <div className="tags">{entry.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
                  )}
                </div>
              </Details>
            )}
          </AnimatePresence>
          {hasDetails && <More $open={open}>{open ? 'Réduire' : 'En savoir plus'}</More>}
        </Card>
      </div>

      <DateLabel className="date">{formatPeriod(entry.start_date, entry.end_date)}</DateLabel>
    </Row>
  )
}

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const [filter, setFilter] = useState<TimelineKind | 'all'>('all')
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 75%', 'end 55%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 25 })

  const kinds = useMemo(() => [...new Set(entries.map(e => e.kind))], [entries])
  const shown = filter === 'all' ? entries : entries.filter(e => e.kind === filter)

  return (
    <>
      {kinds.length > 1 && (
        <LayoutGroup id="timeline-filters">
          <Filters role="group" aria-label="Filtrer le parcours">
            {(['all', ...kinds] as const).map(k => (
              <FilterBtn key={k} type="button" $active={filter === k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {filter === k && <FilterPill layoutId="timeline-filter" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span>{k === 'all' ? 'Tout' : KIND_LABELS[k]}</span>
              </FilterBtn>
            ))}
          </Filters>
        </LayoutGroup>
      )}

      <Track ref={trackRef}>
        <Rail aria-hidden="true"><RailFill style={{ scaleY: fill }} /></Rail>
        {/* Changer de filtre remonte la liste : les étapes rejouent leur entrée.
            Pas d'animation de sortie, qui peut rester bloquée si l'onglet est en arrière-plan. */}
        <div key={filter}>
          {shown.map((entry, i) => (
            <Entry key={entry.id} entry={entry} index={i} side={i % 2 === 0 ? 'left' : 'right'} />
          ))}
        </div>
      </Track>
    </>
  )
}
