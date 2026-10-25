import { useState, useCallback, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  useAdminQuery, adminFetchProjects, adminFetchProject, adminSaveProject, adminDeleteProject,
  slugify, errorText, SLUG_RE, type ProjectInput,
} from '../../lib/adminQueries'
import { Skeleton, ErrorMessage } from '../../components/ui'
import {
  Card, CardTitle, Row, Toolbar, Actions, Field, Input, Textarea, TagInput, Checkbox,
  Button, Notice, type NoticeState,
} from '../../components/admin/form'
import BlockEditor from '../../components/admin/BlockEditor'
import EntryTable from '../../components/admin/EntryTable'
import type { Project } from '../../types/database'

const BASE = '/admin/projets'

// ------------------------------------------------------------
// Liste
// ------------------------------------------------------------
export function ProjectsList() {
  const q = useAdminQuery(adminFetchProjects)
  const { reload } = q

  const onDelete = useCallback(async (id: number) => {
    await adminDeleteProject(id)
    reload()
  }, [reload])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Toolbar>
        <CardTitle>Projets</CardTitle>
        <Button as={Link} to={`${BASE}/nouveau`}>+ Nouveau projet</Button>
      </Toolbar>
      {q.status === 'loading' && <Skeleton $h="10rem" $radius="16px" />}
      {q.status === 'error' && <ErrorMessage message={q.error} />}
      {q.status === 'success' && (
        <EntryTable
          entries={q.data.map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            published: p.published,
            extra: p.featured ? <span>★ mis en avant</span> : null,
          }))}
          basePath={BASE}
          publicPath="/projets"
          onDelete={onDelete}
          emptyText="Aucun projet. Créez le premier !"
        />
      )}
    </div>
  )
}

// ------------------------------------------------------------
// Formulaire
// ------------------------------------------------------------
const EMPTY: ProjectInput = {
  slug: '', title: '', summary: '', content: [], tags: [],
  cover_url: '', repo_url: '', demo_url: '',
  featured: false, published: false, sort_order: 0,
}

function ProjectForm({ initial }: { initial: Project | null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState<ProjectInput>(() => {
    if (!initial) return EMPTY
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = initial
    return rest
  })
  // Le slug suit le titre tant qu'on ne l'a pas modifié à la main
  const [slugTouched, setSlugTouched] = useState(initial !== null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(
    (location.state as { created?: boolean } | null)?.created
      ? { kind: 'success', text: 'Projet créé.' }
      : null,
  )

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setValues(v => ({ ...v, [key]: value }))

  const slugError = values.slug && !SLUG_RE.test(values.slug)
    ? 'Minuscules, chiffres et tirets uniquement (ex : scanner-reseau).'
    : undefined

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (slugError) return
    setPending(true)
    setNotice(null)
    try {
      const id = await adminSaveProject(initial?.id ?? null, values)
      if (initial) {
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
      await adminDeleteProject(initial.id)
      navigate(BASE)
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Actions>
        <Button as={Link} to={BASE} $variant="ghost" $small>← Projets</Button>
        <CardTitle>{initial ? initial.title : 'Nouveau projet'}</CardTitle>
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
          <Field label="Slug (adresse)" hint={`/projets/${values.slug || '…'}`} error={slugError}>
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
        <Field label="Résumé" hint="Une ou deux phrases, affichées sur la carte du projet.">
          {id => <Textarea id={id} rows={2} value={values.summary} onChange={e => set('summary', e.target.value)} />}
        </Field>
        <Field label="Tags">
          {id => <TagInput id={id} value={values.tags} onChange={tags => set('tags', tags)} />}
        </Field>
        <Row $cols={3}>
          <Field label="Dépôt (URL)">
            {id => <Input id={id} type="url" value={values.repo_url} onChange={e => set('repo_url', e.target.value)} />}
          </Field>
          <Field label="Démo (URL)">
            {id => <Input id={id} type="url" value={values.demo_url} onChange={e => set('demo_url', e.target.value)} />}
          </Field>
          <Field label="Image de couverture (URL)">
            {id => <Input id={id} type="url" value={values.cover_url} onChange={e => set('cover_url', e.target.value)} />}
          </Field>
        </Row>
        <Row $cols={3}>
          <Field label="Ordre d'affichage" hint="Plus petit = plus haut.">
            {id => (
              <Input
                id={id}
                type="number"
                value={values.sort_order}
                onChange={e => set('sort_order', Number(e.target.value) || 0)}
              />
            )}
          </Field>
          <Checkbox label="Mis en avant sur l'accueil" checked={values.featured} onChange={v => set('featured', v)} />
          <Checkbox label="Publié" checked={values.published} onChange={v => set('published', v)} />
        </Row>
      </Card>

      <BlockEditor blocks={values.content} onChange={content => set('content', content)} />

      <Notice notice={notice} />
      <Toolbar>
        <Actions>
          <Button type="submit" disabled={pending}>
            {pending ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le projet'}
          </Button>
          {initial?.published && (
            <Button as="a" href={`/projets/${initial.slug}`} target="_blank" rel="noreferrer" $variant="ghost">
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
export function ProjectEditor() {
  const { id } = useParams()
  const fetchOne = useCallback(
    () => (id ? adminFetchProject(Number(id)) : Promise.resolve(null)),
    [id],
  )
  const q = useAdminQuery(fetchOne)

  if (q.status === 'loading') return <Skeleton $h="24rem" $radius="16px" />
  if (q.status === 'error') return <ErrorMessage message={q.error} />
  if (id && !q.data) return <ErrorMessage message="Projet introuvable." />
  return <ProjectForm key={id ?? 'nouveau'} initial={q.data} />
}
