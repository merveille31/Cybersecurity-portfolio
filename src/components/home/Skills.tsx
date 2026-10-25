import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import styled from 'styled-components'
import type { ProfileSkills } from '../../types/database'

const GROUP_LABELS: Record<string, { label: string; hint: string }> = {
  offensif: { label: 'Offensif', hint: 'Trouver et exploiter les failles' },
  défensif: { label: 'Défensif', hint: 'Détecter, analyser, protéger' },
  réseau:   { label: 'Réseau', hint: 'Comprendre ce qui circule' },
  outils:   { label: 'Outils', hint: 'Au quotidien' },
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.surface};
  padding: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Tabs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    overflow-x: auto;
  }
`

const TabBtn = styled.button<{ $active: boolean }>`
  position: relative;
  text-align: left;
  padding: 0.85rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.muted)};
  font: inherit;
  cursor: pointer;
  white-space: nowrap;

  strong, small { position: relative; z-index: 1; display: block; }
  strong { font-size: 0.95rem; }
  small { font-size: 0.75rem; color: ${({ theme }) => theme.colors.muted}; }

  &:hover { color: ${({ theme }) => theme.colors.text}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    small { display: none; }
  }
`

const TabBg = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.gradientSoft};
  box-shadow: inset 0 0 0 1px rgba(34, 229, 138, 0.35);
`

const Panel = styled(motion.ul)`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 0.6rem;
  padding: 0.75rem;
  min-height: 160px;
`

const Chip = styled(motion.li)`
  padding: 0.55rem 1rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.bg};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: default;
  transition: border-color 0.2s, box-shadow 0.2s, color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.green};
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
  }
`

export default function Skills({ skills }: { skills: ProfileSkills }) {
  const groups = Object.entries(skills).filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
  const [active, setActive] = useState(groups[0]?.[0] ?? '')
  const current = groups.find(([g]) => g === active) ?? groups[0]
  if (!current) return null

  return (
    <Layout>
      <LayoutGroup id="skills-tabs">
        <Tabs role="tablist" aria-label="Groupes de compétences">
          {groups.map(([group]) => {
            const meta = GROUP_LABELS[group] ?? { label: group, hint: '' }
            const isActive = group === current[0]
            return (
              <TabBtn key={group} type="button" role="tab" aria-selected={isActive} $active={isActive} onClick={() => setActive(group)}>
                {isActive && <TabBg layoutId="skills-tab" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <strong>{meta.label}</strong>
                {meta.hint && <small>{meta.hint}</small>}
              </TabBtn>
            )
          })}
        </Tabs>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <Panel
          key={current[0]}
          role="tabpanel"
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {current[1].map(skill => (
            <Chip
              key={skill}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.9 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 24 } },
              }}
              whileHover={{ y: -3 }}
            >
              {skill}
            </Chip>
          ))}
        </Panel>
      </AnimatePresence>
    </Layout>
  )
}
