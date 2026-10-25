import { useState, type FormEvent } from 'react'
import { useAdminQuery, adminFetchProfile, adminSaveProfile, errorText } from '../../lib/adminQueries'
import { Skeleton, ErrorMessage } from '../../components/ui'
import {
  Card, CardTitle, Row, Field, Input, Textarea, TagInput, Button, Notice, Actions,
  type NoticeState,
} from '../../components/admin/form'
import type { Profile, ProfileLinks, ProfileSkills } from '../../types/database'

const LINKS: { key: keyof ProfileLinks & string; label: string; placeholder: string }[] = [
  { key: 'github',     label: 'GitHub',      placeholder: 'https://github.com/…' },
  { key: 'linkedin',   label: 'LinkedIn',    placeholder: 'https://linkedin.com/in/…' },
  { key: 'rootme',     label: 'Root-Me',     placeholder: 'https://www.root-me.org/…' },
  { key: 'tryhackme',  label: 'TryHackMe',   placeholder: 'https://tryhackme.com/p/…' },
  { key: 'hackthebox', label: 'Hack The Box', placeholder: 'https://app.hackthebox.com/profile/…' },
]

const SKILL_GROUPS: { key: keyof ProfileSkills & string; label: string }[] = [
  { key: 'offensif', label: 'Offensif' },
  { key: 'défensif', label: 'Défensif' },
  { key: 'réseau',   label: 'Réseau' },
  { key: 'outils',   label: 'Outils' },
]

type FormValues = Omit<Profile, 'id' | 'updated_at'>

const EMPTY: FormValues = {
  full_name: '', headline: '', bio: '', location: '',
  avatar_url: '', cv_url: '', email_public: '',
  links: {}, skills: {},
}

function ProfileForm({ initial }: { initial: Profile | null }) {
  const [values, setValues] = useState<FormValues>(() => {
    if (!initial) return EMPTY
    const { id: _id, updated_at: _u, ...rest } = initial
    return { ...EMPTY, ...rest, links: rest.links ?? {}, skills: rest.skills ?? {} }
  })
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues(v => ({ ...v, [key]: value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setNotice(null)
    // On n'enregistre pas les liens vides
    const links = Object.fromEntries(
      Object.entries(values.links).filter(([, url]) => url && url.trim() !== ''),
    )
    try {
      await adminSaveProfile({ ...values, links })
      setNotice({ kind: 'success', text: 'Profil enregistré.' })
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card>
        <CardTitle>Identité</CardTitle>
        <Row>
          <Field label="Nom affiché">
            {id => <Input id={id} required value={values.full_name} onChange={e => set('full_name', e.target.value)} />}
          </Field>
          <Field label="Localisation">
            {id => <Input id={id} value={values.location} onChange={e => set('location', e.target.value)} />}
          </Field>
        </Row>
        <Field label="Accroche" hint="Affichée sous le nom sur l'accueil.">
          {id => <Input id={id} value={values.headline} onChange={e => set('headline', e.target.value)} />}
        </Field>
        <Field label="Bio" hint="Markdown accepté.">
          {id => <Textarea id={id} rows={6} value={values.bio} onChange={e => set('bio', e.target.value)} />}
        </Field>
      </Card>

      <Card>
        <CardTitle>Contact et fichiers</CardTitle>
        <Row>
          <Field label="E-mail public">
            {id => <Input id={id} type="email" value={values.email_public} onChange={e => set('email_public', e.target.value)} />}
          </Field>
          <Field label="Photo (URL)">
            {id => <Input id={id} type="url" value={values.avatar_url} onChange={e => set('avatar_url', e.target.value)} />}
          </Field>
        </Row>
        <Field label="CV (URL du PDF)">
          {id => <Input id={id} type="url" value={values.cv_url} onChange={e => set('cv_url', e.target.value)} />}
        </Field>
      </Card>

      <Card>
        <CardTitle>Liens</CardTitle>
        <Row>
          {LINKS.map(link => (
            <Field key={link.key} label={link.label}>
              {id => (
                <Input
                  id={id}
                  type="url"
                  placeholder={link.placeholder}
                  value={values.links[link.key] ?? ''}
                  onChange={e => set('links', { ...values.links, [link.key]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </Row>
      </Card>

      <Card>
        <CardTitle>Compétences</CardTitle>
        <Row>
          {SKILL_GROUPS.map(group => (
            <Field key={group.key} label={group.label}>
              {id => (
                <TagInput
                  id={id}
                  value={values.skills[group.key] ?? []}
                  onChange={list => set('skills', { ...values.skills, [group.key]: list })}
                />
              )}
            </Field>
          ))}
        </Row>
      </Card>

      <Notice notice={notice} />
      <Actions>
        <Button type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer le profil'}</Button>
      </Actions>
    </form>
  )
}

export default function ProfileAdmin() {
  const q = useAdminQuery(adminFetchProfile)
  if (q.status === 'loading') return <Skeleton $h="20rem" $radius="16px" />
  if (q.status === 'error') return <ErrorMessage message={q.error} />
  return <ProfileForm initial={q.data} />
}
