import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import {
  useAdminQuery, adminFetchTimeline, adminSaveTimeline, adminDeleteTimeline,
  errorText, type TimelineInput,
} from '../../lib/adminQueries'
import { Skeleton, ErrorMessage } from '../../components/ui'
import {
  Card, CardTitle, Row, Toolbar, Actions, Field, Input, Select, Textarea, TagInput, Checkbox,
  Button, Notice, Muted, StatusPill, type NoticeState,
} from '../../components/admin/form'
import { KIND_LABELS, formatPeriod } from '../../lib/timeline'
import type { TimelineEntry, TimelineKind } from '../../types/database'

const List = styled.ul`
  list-style: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

const Item = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: ${({ theme }) => theme.colors.surface};
  & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const Meta = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.muted};
`

const EMPTY: TimelineInput = {
  kind: 'formation', title: '', organization: '', location: '',
  start_date: '', end_date: null, description: '', tags: [], published: true, sort_order: 0,
}

function TimelineForm({ initial, onDone, onCancel }: {
  initial: TimelineEntry | null
  onDone: (msg: string) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<TimelineInput>(() => {
    if (!initial) return EMPTY
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = initial
    return rest
  })
  const [current, setCurrent] = useState(initial ? initial.end_date === null : false)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const set = <K extends keyof TimelineInput>(key: K, value: TimelineInput[K]) =>
    setValues(v => ({ ...v, [key]: value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!current && values.end_date && values.end_date < values.start_date) {
      setNotice({ kind: 'error', text: 'La date de fin doit être après la date de début.' })
      return
    }
    setPending(true)
    setNotice(null)
    try {
      await adminSaveTimeline(initial?.id ?? null, { ...values, end_date: current ? null : values.end_date || null })
      onDone(initial ? 'Étape modifiée.' : 'Étape ajoutée au parcours.')
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
      setPending(false)
    }
  }

  return (
    <Card as="form" onSubmit={onSubmit}>
      <CardTitle>{initial ? `Modifier « ${initial.title} »` : 'Nouvelle étape du parcours'}</CardTitle>
      <Row $cols={3}>
        <Field label="Type">
          {id => (
            <Select id={id} value={values.kind} onChange={e => set('kind', e.target.value as TimelineKind)}>
              {(Object.keys(KIND_LABELS) as TimelineKind[]).map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Intitulé" hint="Ex : Master Cybersécurité, Stage analyste SOC">
          {id => <Input id={id} required maxLength={200} value={values.title} onChange={e => set('title', e.target.value)} />}
        </Field>
        <Field label="Établissement / entreprise">
          {id => <Input id={id} value={values.organization} onChange={e => set('organization', e.target.value)} />}
        </Field>
      </Row>
      <Row $cols={3}>
        <Field label="Début">
          {id => <Input id={id} type="date" required value={values.start_date} onChange={e => set('start_date', e.target.value)} />}
        </Field>
        <Field label="Fin">
          {id => (
            <Input
              id={id}
              type="date"
              disabled={current}
              value={current ? '' : values.end_date ?? ''}
              onChange={e => set('end_date', e.target.value || null)}
            />
          )}
        </Field>
        <Field label="Lieu">
          {id => <Input id={id} value={values.location} onChange={e => set('location', e.target.value)} />}
        </Field>
      </Row>
      <Checkbox label="En cours (pas de date de fin)" checked={current} onChange={setCurrent} />
      <Field label="Description" hint="Ce que vous y avez appris ou réalisé. Markdown accepté.">
        {id => <Textarea id={id} rows={4} value={values.description} onChange={e => set('description', e.target.value)} />}
      </Field>
      <Field label="Compétences / outils associés">
        {id => <TagInput id={id} value={values.tags} onChange={tags => set('tags', tags)} />}
      </Field>
      <Row>
        <Field label="Ordre (si même date de début)">
          {id => <Input id={id} type="number" value={values.sort_order} onChange={e => set('sort_order', Number(e.target.value) || 0)} />}
        </Field>
        <Checkbox label="Visible sur le site" checked={values.published} onChange={v => set('published', v)} />
      </Row>
      <Notice notice={notice} />
      <Actions>
        <Button type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        <Button type="button" $variant="ghost" onClick={onCancel}>Annuler</Button>
      </Actions>
    </Card>
  )
}

export default function TimelineAdmin() {
  const q = useAdminQuery(adminFetchTimeline)
  const [editing, setEditing] = useState<TimelineEntry | 'new' | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const onDelete = async (entry: TimelineEntry) => {
    if (!window.confirm(`Supprimer « ${entry.title} » du parcours ?`)) return
    setDeleting(entry.id)
    setNotice(null)
    try {
      await adminDeleteTimeline(entry.id)
      setNotice({ kind: 'success', text: `« ${entry.title} » supprimé.` })
      q.reload()
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Toolbar>
        <div>
          <CardTitle>Parcours</CardTitle>
          <Muted>Formations et expériences affichées en frise interactive sur l'accueil.</Muted>
        </div>
        {editing === null && (
          <Button type="button" onClick={() => { setNotice(null); setEditing('new') }}>+ Ajouter une étape</Button>
        )}
      </Toolbar>

      {editing !== null && (
        <TimelineForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={msg => { setEditing(null); setNotice({ kind: 'success', text: msg }); q.reload() }}
        />
      )}

      <Notice notice={notice} />

      {q.status === 'loading' && <Skeleton $h="8rem" $radius="16px" />}
      {q.status === 'error' && <ErrorMessage message={q.error} />}
      {q.status === 'success' && (q.data.length === 0
        ? <Muted>Aucune étape. Ajoutez vos formations et expériences.</Muted>
        : (
          <List>
            {q.data.map(entry => (
              <Item key={entry.id}>
                <div>
                  <strong>{entry.title}</strong>
                  <Meta>
                    <StatusPill $on={entry.published}>{entry.published ? 'visible' : 'masqué'}</StatusPill>
                    <span>{KIND_LABELS[entry.kind]}</span>
                    {entry.organization && <span>· {entry.organization}</span>}
                    <span>· {formatPeriod(entry.start_date, entry.end_date)}</span>
                  </Meta>
                </div>
                <Actions>
                  <Button type="button" $variant="ghost" $small onClick={() => { setNotice(null); setEditing(entry) }}>Modifier</Button>
                  <Button type="button" $variant="danger" $small disabled={deleting === entry.id} onClick={() => onDelete(entry)}>
                    {deleting === entry.id ? 'Suppression…' : 'Supprimer'}
                  </Button>
                </Actions>
              </Item>
            ))}
          </List>
        ))}
    </div>
  )
}
