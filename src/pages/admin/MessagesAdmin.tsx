import { useState } from 'react'
import styled from 'styled-components'
import {
  useAdminQuery, adminFetchMessages, adminSetMessageRead, adminDeleteMessage, errorText,
} from '../../lib/adminQueries'
import { Skeleton, ErrorMessage } from '../../components/ui'
import { CardTitle, Toolbar, Actions, Button, Notice, Muted, type NoticeState } from '../../components/admin/form'
import type { Message } from '../../types/database'

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

const Item = styled.li<{ $unread: boolean }>`
  background: ${({ theme, $unread }) => ($unread ? theme.colors.surfaceHover : theme.colors.surface)};
  & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; }
`

const Summary = styled.button<{ $unread: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  .who { font-weight: ${({ $unread }) => ($unread ? 700 : 500)}; }
  .subject {
    display: block;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.muted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .date { font-size: 0.75rem; color: ${({ theme }) => theme.colors.muted}; white-space: nowrap; }
`

const UnreadDot = styled.span<{ $on: boolean }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ theme, $on }) => ($on ? theme.colors.blue : 'transparent')};
  box-shadow: ${({ $on }) => ($on ? '0 0 0 3px rgba(61, 139, 255, 0.2)' : 'none')};
`

const Body = styled.div`
  padding: 0 1rem 1rem 2.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  p {
    white-space: pre-wrap;
    line-height: 1.65;
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }
  .email { font-family: ${({ theme }) => theme.fonts.mono}; font-size: 0.8rem; color: ${({ theme }) => theme.colors.blue}; }
`

const Filter = styled.div`
  display: inline-flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;

  button {
    padding: 0.4rem 0.8rem;
    border: none;
    background: none;
    color: ${({ theme }) => theme.colors.muted};
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;
  }
  button[aria-pressed='true'] { background: ${({ theme }) => theme.colors.greenDim}; color: ${({ theme }) => theme.colors.text}; }
`

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesAdmin() {
  const q = useAdminQuery(adminFetchMessages)
  const [openId, setOpenId] = useState<number | null>(null)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)
  // Mises à jour locales immédiates (lu / supprimé) en attendant le rechargement
  const [overrides, setOverrides] = useState<Record<number, Partial<Message> | 'deleted'>>({})

  const run = async (id: number, action: () => Promise<void>, local: Partial<Message> | 'deleted') => {
    setBusy(id)
    setNotice(null)
    try {
      await action()
      setOverrides(o => ({ ...o, [id]: local === 'deleted' ? 'deleted' : { ...(o[id] as Partial<Message>), ...local } }))
      if (local === 'deleted') setNotice({ kind: 'success', text: 'Message supprimé.' })
    } catch (err) {
      setNotice({ kind: 'error', text: errorText(err) })
    } finally {
      setBusy(null)
    }
  }

  if (q.status === 'loading') return <Skeleton $h="14rem" $radius="16px" />
  if (q.status === 'error') return <ErrorMessage message={q.error} />

  const messages = q.data
    .filter(m => overrides[m.id] !== 'deleted')
    .map(m => ({ ...m, ...(overrides[m.id] as Partial<Message> | undefined) }))
  const unread = messages.filter(m => !m.read).length
  const shown = onlyUnread ? messages.filter(m => !m.read) : messages

  const toggleOpen = (m: Message) => {
    const opening = openId !== m.id
    setOpenId(opening ? m.id : null)
    // Ouvrir un message le marque comme lu
    if (opening && !m.read) void run(m.id, () => adminSetMessageRead(m.id, true), { read: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Toolbar>
        <CardTitle>Messages {unread > 0 && `(${unread} non lu${unread > 1 ? 's' : ''})`}</CardTitle>
        <Actions>
          <Filter role="group" aria-label="Filtre">
            <button type="button" aria-pressed={!onlyUnread} onClick={() => setOnlyUnread(false)}>Tous</button>
            <button type="button" aria-pressed={onlyUnread} onClick={() => setOnlyUnread(true)}>Non lus</button>
          </Filter>
          <Button type="button" $variant="ghost" $small onClick={() => { setOverrides({}); q.reload() }}>Actualiser</Button>
        </Actions>
      </Toolbar>

      <Notice notice={notice} />

      {shown.length === 0
        ? <Muted>{onlyUnread ? 'Aucun message non lu.' : 'Aucun message pour le moment. Ils arriveront ici depuis la page Contact.'}</Muted>
        : (
          <List>
            {shown.map(m => (
              <Item key={m.id} $unread={!m.read}>
                <Summary type="button" $unread={!m.read} aria-expanded={openId === m.id} onClick={() => toggleOpen(m)}>
                  <UnreadDot $on={!m.read} aria-label={m.read ? undefined : 'non lu'} />
                  <span style={{ minWidth: 0 }}>
                    <span className="who">{m.name}</span>
                    <span className="subject">{m.subject}</span>
                  </span>
                  <span className="date">{fmt(m.created_at)}</span>
                </Summary>
                {openId === m.id && (
                  <Body>
                    <span className="email">{m.email}</span>
                    <p>{m.body}</p>
                    <Actions>
                      <Button
                        as="a"
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                        $small
                      >
                        Répondre par e-mail
                      </Button>
                      <Button
                        type="button"
                        $variant="ghost"
                        $small
                        disabled={busy === m.id}
                        onClick={() => run(m.id, () => adminSetMessageRead(m.id, !m.read), { read: !m.read })}
                      >
                        Marquer comme {m.read ? 'non lu' : 'lu'}
                      </Button>
                      <Button
                        type="button"
                        $variant="danger"
                        $small
                        disabled={busy === m.id}
                        onClick={() => {
                          if (window.confirm(`Supprimer le message de ${m.name} ?`)) {
                            void run(m.id, () => adminDeleteMessage(m.id), 'deleted')
                          }
                        }}
                      >
                        Supprimer
                      </Button>
                    </Actions>
                  </Body>
                )}
              </Item>
            ))}
          </List>
        )}
    </div>
  )
}
