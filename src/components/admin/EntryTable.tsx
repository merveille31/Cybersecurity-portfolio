import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Actions, StatusPill, Notice, Muted, type NoticeState } from './form'
import { errorText } from '../../lib/adminQueries'

// Liste des projets / write-ups dans l'admin : titre, statut, actions.

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
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

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`

const ItemTitle = styled(Link)`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  &:hover { color: ${({ theme }) => theme.colors.green}; }
`

const Meta = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.muted};
`

export type Entry = {
  id: number
  title: string
  slug: string
  published: boolean
  extra?: ReactNode
}

export default function EntryTable({
  entries,
  basePath,
  publicPath,
  onDelete,
  emptyText,
}: {
  entries: Entry[]
  basePath: string
  publicPath: string
  onDelete: (id: number) => Promise<void>
  emptyText: string
}) {
  const [deleting, setDeleting] = useState<number | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)

  const handleDelete = async (entry: Entry) => {
    if (!window.confirm(`Supprimer définitivement « ${entry.title} » ?`)) return
    setDeleting(entry.id)
    setNotice(null)
    try {
      await onDelete(entry.id)
      setNotice({ kind: 'success', text: `« ${entry.title} » supprimé.` })
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <Notice notice={notice} />
      {entries.length === 0
        ? <Muted>{emptyText}</Muted>
        : (
          <List>
            {entries.map(entry => (
              <Item key={entry.id}>
                <Info>
                  <ItemTitle to={`${basePath}/${entry.id}`}>{entry.title}</ItemTitle>
                  <Meta>
                    <StatusPill $on={entry.published}>{entry.published ? 'publié' : 'brouillon'}</StatusPill>
                    <span>/{entry.slug}</span>
                    {entry.extra}
                  </Meta>
                </Info>
                <Actions>
                  {entry.published && (
                    <Button as="a" href={`${publicPath}/${entry.slug}`} target="_blank" rel="noreferrer" $variant="ghost" $small>
                      Voir
                    </Button>
                  )}
                  <Button as={Link} to={`${basePath}/${entry.id}`} $variant="ghost" $small>Modifier</Button>
                  <Button type="button" $variant="danger" $small disabled={deleting === entry.id} onClick={() => handleDelete(entry)}>
                    {deleting === entry.id ? 'Suppression…' : 'Supprimer'}
                  </Button>
                </Actions>
              </Item>
            ))}
          </List>
        )}
    </>
  )
}
