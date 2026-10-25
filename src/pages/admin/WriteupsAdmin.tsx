import { useState, useCallback, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  useAdminQuery, adminFetchWriteups, adminFetchWriteup, adminSaveWriteup, adminDeleteWriteup,
  slugify, errorText, SLUG_RE, type WriteupInput,
} from '../../lib/adminQueries'
import { Skeleton, ErrorMessage, Badge } from '../../components/ui'
import {
  Card, CardTitle, Row, Toolbar, Actions, Field, Input, Select, Textarea, TagInput, Checkbox,
  Button, Notice, UrlUploadInput, type NoticeState,
} from '../../components/admin/form'
import BlockEditor from '../../components/admin/BlockEditor'
import EntryTable from '../../components/admin/EntryTable'
import type { Writeup, WriteupCategory, WriteupDifficulty } from '../../types/database'

const BASE = '/admin/blog'

// Mêmes valeurs que les contraintes CHECK de 001_init.sql
const CATEGORIES: WriteupCategory[] = ['web', 'pwn', 'forensics', 'crypto', 'reverse', 'osint', 'réseau', 'autre']
const DIFFICULTIES: WriteupDifficulty[] = ['facile', 'moyen', 'difficile', 'insane']

// ------------------------------------------------------------
// Liste
// ------------------------------------------------------------
export function WriteupsList() {
  const q = useAdminQuery(adminFetchWriteups)
  const { reload } = q

  const onDelete = useCallback(async (id: number) => {
    await adminDeleteWriteup(id)
    reload()
  }, [reload])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Toolbar>
        <CardTitle>Blog</CardTitle>
        <Button as={Link} to={`${BASE}/nouveau`}>+ Nouvel article</Button>
      </Toolbar>
      {q.status === 'loading' && <Skeleton $h="10rem" $radius="16px" />}
      {q.status === 'error' && <ErrorMessage message={q.error} />}
      {q.status === 'success' && (
        <EntryTable
          entries={q.data.map(w => ({
            id: w.id,
            title: w.title,
            slug: w.slug,
            published: w.published,
            extra: (
              <>
                <span>{w.platform || '—'} · {w.category}</span>
                <Badge $value={w.difficulty}>{w.difficulty}</Badge>
              </>
            ),
          }))}
          basePath={BASE}
          publicPath="/blog"
          onDelete={onDelete}
          emptyText="Aucun article. Rédigez le premier !"
        />
      )}
    </div>
  )
}

// ------------------------------------------------------------
// Formulaire
// ------------------------------------------------------------
const EMPTY: WriteupInput = {
  slug: '', title: '', summary: '', platform: '',
  category: 'web', difficulty: 'facile',
  tags: [], content: [], cover_url: '',
  published: false, published_at: null,
}

function WriteupForm({ initial }: { initial: Writeup | null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState<WriteupInput>(() => {
    if (!initial) return EMPTY
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = initial
    return rest
  })
  const [slugTouched, setSlugTouched] = useState(initial !== null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(
    (location.state as { created?: boolean } | null)?.created
      ? { kind: 'success', text: 'Article créé.' }
      : null,
  )

  const set = <K extends keyof WriteupInput>(key: K, value: WriteupInput[K]) =>
    setValues(v => ({ ...v, [key]: value }))

  const slugError = values.slug && !SLUG_RE.test(values.slug)
    ? 'Minuscules, chiffres et tirets uniquement (ex : htb-lame).'
    : undefined

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (slugError) return
    setPending(true)
    setNotice(null)
    // Date de publication fixée automatiquement à la première publication
    const payload: WriteupInput = {
      ...values,
      published_at: values.published && !values.published_at
        ? new Date().toISOString()
        : values.published_at,
    }
    try {
      const id = await adminSaveWriteup(initial?.id ?? null, payload)
      if (initial) {
        setValues(payload)
        setNotice({ kind: 'success', text: 'Modifications enregistrées.' })
      } else {
        navigate(`${BASE}/${id}`, { replace: true, state: { created: true } })
      }
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
    } finally {
      setPending(false)
    }
  }

  const onDelete = async () => {
    if (!initial || !window.confirm(`Supprimer définitivement « ${initial.title} » ?`)) return
    setPending(true)
    try {
      await adminDeleteWriteup(initial.id)
      navigate(BASE)
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Actions>
        <Button as={Link} to={BASE} $variant="ghost" $small>← Blog</Button>
        <CardTitle>{initial ? initial.title : 'Nouvel article'}</CardTitle>
      </Actions>

      <Card>
        <Row>
          <Field label="Titre">
            {id => (
              <Input
                id={id}
                required
                value={values.title}
                onChange={e => setValues(v => ({
                  ...v,
                  title: e.target.value,
                  slug: slugTouched ? v.slug : slugify(e.target.value),
                }))}
              />
            )}
          </Field>
          <Field label="Slug (adresse)" hint={`/blog/${values.slug || '…'}`} error={slugError}>
            {id => (
              <Input
                id={id}
                required
                value={values.slug}
                onChange={e => { setSlugTouched(true); set('slug', e.target.value) }}
              />
            )}
          </Field>
        </Row>
        <Field label="Résumé">
          {id => <Textarea id={id} rows={2} value={values.summary} onChange={e => set('summary', e.target.value)} />}
        </Field>
        <Row $cols={3}>
          <Field label="Plateforme" hint="Ex : TryHackMe, Hack The Box, Root-Me">
            {id => <Input id={id} value={values.platform} onChange={e => set('platform', e.target.value)} />}
          </Field>
          <Field label="Catégorie">
            {id => (
              <Select id={id} value={values.category} onChange={e => set('category', e.target.value as WriteupCategory)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Difficulté">
            {id => (
              <Select id={id} value={values.difficulty} onChange={e => set('difficulty', e.target.value as WriteupDifficulty)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            )}
          </Field>
        </Row>
        <Field label="Tags">
          {id => <TagInput id={id} value={values.tags} onChange={tags => set('tags', tags)} />}
        </Field>
        <Row $cols={3}>
          <Field label="Image de couverture">
            {id => <UrlUploadInput id={id} kind="image" value={values.cover_url} onChange={url => set('cover_url', url)} />}
          </Field>
          <Field label="Date de publication" hint="Remplie automatiquement à la première publication.">
            {id => (
              <Input
                id={id}
                type="date"
                value={values.published_at ? values.published_at.slice(0, 10) : ''}
                onChange={e => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            )}
          </Field>
          <Checkbox label="Publié" checked={values.published} onChange={v => set('published', v)} />
        </Row>
      </Card>

      <BlockEditor blocks={values.content} onChange={content => set('content', content)} />

      <Notice notice={notice} />
      <Toolbar>
        <Actions>
          <Button type="submit" disabled={pending}>
            {pending ? 'Enregistrement…' : initial ? 'Enregistrer' : "Créer l'article"}
          </Button>
          {initial?.published && (
            <Button as="a" href={`/blog/${initial.slug}`} target="_blank" rel="noreferrer" $variant="ghost">
              Voir sur le site
            </Button>
          )}
        </Actions>
        {initial && (
          <Button type="button" $variant="danger" disabled={pending} onClick={onDelete}>Supprimer</Button>
        )}
      </Toolbar>
    </form>
  )
}

// ------------------------------------------------------------
// Page d'édition (création si pas d'id)
// ------------------------------------------------------------
export function WriteupEditor() {
  const { id } = useParams()
  const fetchOne = useCallback(
    () => (id ? adminFetchWriteup(Number(id)) : Promise.resolve(null)),
    [id],
  )
  const q = useAdminQuery(fetchOne)

  if (q.status === 'loading') return <Skeleton $h="24rem" $radius="16px" />
  if (q.status === 'error') return <ErrorMessage message={q.error} />
  if (id && !q.data) return <ErrorMessage message="Article introuvable." />
  return <WriteupForm key={id ?? 'nouveau'} initial={q.data} />
}
