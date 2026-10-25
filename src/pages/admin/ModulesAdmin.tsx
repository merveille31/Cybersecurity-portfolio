import { useState } from 'react'
import styled from 'styled-components'
import { useAdminQuery, adminFetchProfile, adminSaveModules, errorText } from '../../lib/adminQueries'
import { MODULE_GROUPS } from '../../lib/modules'
import { Skeleton, ErrorMessage } from '../../components/ui'
import { Card, CardTitle, Muted, Button, Notice, Actions, Switch, type NoticeState } from '../../components/admin/form'
import type { Modules } from '../../types/database'

const Line = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;

  & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; }

  strong { display: block; font-size: 0.92rem; font-weight: 600; }
  span { font-size: 0.8rem; color: ${({ theme }) => theme.colors.muted}; }
`

function ModulesForm({ initial }: { initial: Modules }) {
  const [modules, setModules] = useState<Modules>(initial)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const dirty = JSON.stringify(modules) !== JSON.stringify(initial)

  const set = (key: string, on: boolean) => {
    setNotice(null)
    // On ne stocke que les désactivations : une clé absente = activé
    setModules(m => {
      const next = { ...m }
      if (on) delete next[key]
      else next[key] = false
      return next
    })
  }

  const save = async () => {
    setPending(true)
    setNotice(null)
    try {
      await adminSaveModules(modules)
      setNotice({ kind: 'success', text: 'Modules enregistrés. Rechargez le site pour voir le résultat.' })
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <CardTitle>Modules</CardTitle>
        <Muted>Activez ou masquez des parties du site sans rien supprimer : le contenu reste dans l'admin.</Muted>
      </div>

      {MODULE_GROUPS.map(group => (
        <Card key={group.title}>
          <CardTitle>{group.title}</CardTitle>
          <div>
            {group.modules.map(mod => {
              const on = modules[mod.key] !== false
              const parentOff = mod.key.startsWith('social_') && modules.socials === false
              return (
                <Line key={mod.key}>
                  <div>
                    <strong style={{ opacity: parentOff ? 0.5 : 1 }}>{mod.label}</strong>
                    {mod.description && <span>{mod.description}</span>}
                    {parentOff && <span>Masqué car « Tous les réseaux » est désactivé.</span>}
                  </div>
                  <Switch checked={on} label={mod.label} onChange={v => set(mod.key, v)} />
                </Line>
              )
            })}
          </div>
        </Card>
      ))}

      <Notice notice={notice} />
      <Actions>
        <Button type="button" disabled={pending || !dirty} onClick={save}>
          {pending ? 'Enregistrement…' : 'Enregistrer les modules'}
        </Button>
        {dirty && <Muted>Modifications non enregistrées.</Muted>}
      </Actions>
    </div>
  )
}

export default function ModulesAdmin() {
  const q = useAdminQuery(adminFetchProfile)
  if (q.status === 'loading') return <Skeleton $h="20rem" $radius="16px" />
  if (q.status === 'error') return <ErrorMessage message={q.error} />
  return <ModulesForm initial={q.data?.modules ?? {}} />
}
