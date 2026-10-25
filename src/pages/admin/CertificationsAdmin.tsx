import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import {
  useAdminQuery, adminFetchCertifications, adminSaveCertification, adminDeleteCertification,
  errorText, type CertificationInput,
} from '../../lib/adminQueries'
import { Skeleton, ErrorMessage } from '../../components/ui'
import {
  Card, CardTitle, Row, Toolbar, Actions, Field, Input, Select, Button, Notice, Muted, StatusPill,
  type NoticeState,
} from '../../components/admin/form'
import type { Certification, CertificationStatus } from '../../types/database'

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

const EMPTY: CertificationInput = {
  name: '', issuer: '', status: 'en_cours', obtained_at: null, credential_url: '', sort_order: 0,
}

// ------------------------------------------------------------
// Formulaire (ajout ou modification)
// ------------------------------------------------------------
function CertificationForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: Certification | null
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<CertificationInput>(() => {
    if (!initial) return EMPTY
    const { id: _id, ...rest } = initial
    return rest
  })
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const set = <K extends keyof CertificationInput>(key: K, value: CertificationInput[K]) =>
    setValues(v => ({ ...v, [key]: value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setNotice(null)
    try {
      // Une certification en cours n'a pas de date d'obtention
      await adminSaveCertification(initial?.id ?? null, {
        ...values,
        obtained_at: values.status === 'obtenue' ? values.obtained_at : null,
      })
      onDone(initial ? 'Certification modifiée.' : 'Certification ajoutée.')
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
      setPending(false)
    }
  }

  return (
    <Card as="form" onSubmit={onSubmit}>
      <CardTitle>{initial ? `Modifier « ${initial.name} »` : 'Nouvelle certification'}</CardTitle>
      <Row>
        <Field label="Nom" hint="Ex : eJPT, CompTIA Security+">
          {id => <Input id={id} required value={values.name} onChange={e => set('name', e.target.value)} />}
        </Field>
        <Field label="Organisme">
          {id => <Input id={id} value={values.issuer} onChange={e => set('issuer', e.target.value)} />}
        </Field>
      </Row>
      <Row $cols={3}>
        <Field label="Statut">
          {id => (
            <Select id={id} value={values.status} onChange={e => set('status', e.target.value as CertificationStatus)}>
              <option value="en_cours">En cours</option>
              <option value="obtenue">Obtenue</option>
            </Select>
          )}
        </Field>
        <Field label="Date d'obtention">
          {id => (
            <Input
              id={id}
              type="date"
              disabled={values.status !== 'obtenue'}
              value={values.obtained_at ?? ''}
              onChange={e => set('obtained_at', e.target.value || null)}
            />
          )}
        </Field>
        <Field label="Ordre d'affichage">
          {id => (
            <Input id={id} type="number" value={values.sort_order} onChange={e => set('sort_order', Number(e.target.value) || 0)} />
          )}
        </Field>
      </Row>
      <Field label="Lien de vérification (URL)">
        {id => <Input id={id} type="url" value={values.credential_url} onChange={e => set('credential_url', e.target.value)} />}
      </Field>
      <Notice notice={notice} />
      <Actions>
        <Button type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        <Button type="button" $variant="ghost" onClick={onCancel}>Annuler</Button>
      </Actions>
    </Card>
  )
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function CertificationsAdmin() {
  const q = useAdminQuery(adminFetchCertifications)
  const [editing, setEditing] = useState<Certification | 'new' | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const onDelete = async (cert: Certification) => {
    if (!window.confirm(`Supprimer « ${cert.name} » ?`)) return
    setDeleting(cert.id)
    setNotice(null)
    try {
      await adminDeleteCertification(cert.id)
      setNotice({ kind: 'success', text: `« ${cert.name} » supprimée.` })
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
        <CardTitle>Certifications</CardTitle>
        {editing === null && (
          <Button type="button" onClick={() => { setNotice(null); setEditing('new') }}>+ Ajouter</Button>
        )}
      </Toolbar>

      {editing !== null && (
        <CertificationForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={message => {
            setEditing(null)
            setNotice({ kind: 'success', text: message })
            q.reload()
          }}
        />
      )}

      <Notice notice={notice} />

      {q.status === 'loading' && <Skeleton $h="8rem" $radius="16px" />}
      {q.status === 'error' && <ErrorMessage message={q.error} />}
      {q.status === 'success' && (q.data.length === 0
        ? <Muted>Aucune certification pour l'instant.</Muted>
        : (
          <List>
            {q.data.map(cert => (
              <Item key={cert.id}>
                <div>
                  <strong>{cert.name}</strong>
                  <Meta>
                    <StatusPill $on={cert.status === 'obtenue'}>
                      {cert.status === 'obtenue' ? 'obtenue' : 'en cours'}
                    </StatusPill>
                    {cert.issuer && <span>{cert.issuer}</span>}
                    {cert.obtained_at && <span>{new Date(cert.obtained_at).toLocaleDateString('fr-FR')}</span>}
                  </Meta>
                </div>
                <Actions>
                  <Button type="button" $variant="ghost" $small onClick={() => { setNotice(null); setEditing(cert) }}>
                    Modifier
                  </Button>
                  <Button type="button" $variant="danger" $small disabled={deleting === cert.id} onClick={() => onDelete(cert)}>
                    {deleting === cert.id ? 'Suppression…' : 'Supprimer'}
                  </Button>
                </Actions>
              </Item>
            ))}
          </List>
        ))}
    </div>
  )
}
