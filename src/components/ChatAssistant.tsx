import { useState, useRef, useEffect, useCallback, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import { askAssistant, onAssistantOpen, AssistantError, type ChatMessage } from '../lib/assistant'

// Fenêtre de discussion avec l'assistant IA (bouton flottant en bas à droite).

const SUGGESTIONS = [
  'Quel est le parcours de Carelle ?',
  'Quelles sont ses compétences en sécurité ?',
  'Présente-moi un de ses projets',
  'Quelles certifications a-t-elle ?',
]

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Bonjour ! Je suis l'assistant de Carelle. Posez-moi vos questions sur son parcours, ses compétences, ses projets ou ses write-ups CTF.",
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 229, 138, 0.45), 0 10px 30px -8px rgba(34, 229, 138, 0.6); }
  50%      { box-shadow: 0 0 0 12px rgba(34, 229, 138, 0), 0 10px 30px -8px rgba(34, 229, 138, 0.6); }
`

const Fab = styled(motion.button)<{ $pulse: boolean }>`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.2rem;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.gradient};
  color: ${({ theme }) => theme.colors.onAccent};
  font: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  animation: ${({ $pulse }) => ($pulse ? pulse : 'none')} 2.4s ease-in-out infinite;

  @media (max-width: 480px) {
    right: 1rem;
    bottom: 1rem;
    padding: 0.85rem;
    .label { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`

const Panel = styled(motion.div)`
  position: fixed;
  right: 1.5rem;
  bottom: 5.5rem;
  z-index: 200;
  width: 390px;
  height: min(580px, calc(100svh - 7.5rem));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(34, 229, 138, 0.12);

  @media (max-width: 480px) {
    left: 0.75rem;
    right: 0.75rem;
    bottom: 5rem;
    width: auto;
    height: min(75svh, 580px);
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.gradientSoft};
`

const Avatar = styled.div`
  position: relative;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.gradient};
  color: ${({ theme }) => theme.colors.onAccent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;

  &::after {
    content: '';
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.green};
    border: 2px solid ${({ theme }) => theme.colors.surface};
  }
`

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
  strong { display: block; font-size: 0.92rem; }
  span { font-size: 0.72rem; color: ${({ theme }) => theme.colors.muted}; }
`

const IconBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid transparent;
  background: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  font-size: 0.95rem;
  &:hover { color: ${({ theme }) => theme.colors.text}; border-color: ${({ theme }) => theme.colors.border}; }
`

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Bubble = styled.div<{ $user: boolean }>`
  max-width: 86%;
  align-self: ${({ $user }) => ($user ? 'flex-end' : 'flex-start')};
  padding: 0.65rem 0.9rem;
  border-radius: 16px;
  border-bottom-right-radius: ${({ $user }) => ($user ? '4px' : '16px')};
  border-bottom-left-radius: ${({ $user }) => ($user ? '16px' : '4px')};
  font-size: 0.88rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: ${({ theme, $user }) => ($user ? theme.colors.onAccent : theme.colors.text)};
  background: ${({ theme, $user }) => ($user ? theme.colors.green : theme.colors.bg)};
  border: 1px solid ${({ theme, $user }) => ($user ? 'transparent' : theme.colors.border)};

  a { color: ${({ theme, $user }) => ($user ? 'inherit' : theme.colors.blue)}; text-decoration: underline; text-underline-offset: 2px; }
  strong { font-weight: 700; }
`

const blink = keyframes`
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
`

const Typing = styled.span`
  display: inline-flex;
  gap: 4px;
  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.green};
    animation: ${blink} 1.2s infinite;
  }
  i:nth-child(2) { animation-delay: 0.15s; }
  i:nth-child(3) { animation-delay: 0.3s; }
`

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const Chip = styled.button`
  padding: 0.4rem 0.75rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid rgba(61, 139, 255, 0.4);
  background: ${({ theme }) => theme.colors.blueDim};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
  &:hover { border-color: ${({ theme }) => theme.colors.blue}; }
`

const Form = styled.form`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.65rem 0.9rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 0.88rem;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.green}; }
`

const Send = styled.button`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.green};
  color: ${({ theme }) => theme.colors.onAccent};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const Disclaimer = styled.p`
  padding: 0 0.9rem 0.6rem;
  font-size: 0.66rem;
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
`

// ------------------------------------------------------------
// Mise en forme légère : **gras**, [texte](lien) et chemins internes /page
// ------------------------------------------------------------
const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w.])(\/(?:projets|writeups|a-propos|contact)(?:\/[a-z0-9-]+)?)/g

function renderInline(text: string, onNavigate: () => void): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${m.index}`
    if (m[1]) out.push(<strong key={key}>{m[1]}</strong>)
    else if (m[2] && m[3]) {
      out.push(m[3].startsWith('/')
        ? <Link key={key} to={m[3]} onClick={onNavigate}>{m[2]}</Link>
        : <a key={key} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>)
    } else if (m[4]) out.push(<Link key={key} to={m[4]} onClick={onNavigate}>{m[4]}</Link>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// ------------------------------------------------------------
// Composant
// ------------------------------------------------------------
export default function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [seen, setSeen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(async (text: string) => {
    const question = text.trim()
    if (!question || pending) return
    setInput('')
    setPending(true)

    // On n'envoie pas le message d'accueil, purement décoratif
    const history = [...messages.filter(m => m !== WELCOME), { role: 'user' as const, content: question }]
    setMessages(prev => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller
    try {
      await askAssistant(history, delta => {
        setMessages(prev => {
          const next = [...prev]
          const lastMsg = next[next.length - 1]
          next[next.length - 1] = { ...lastMsg, content: lastMsg.content + delta }
          return next
        })
      }, controller.signal)
    } catch (err) {
      if (controller.signal.aborted) return
      const msg = err instanceof AssistantError
        ? err.message
        : 'Connexion impossible pour le moment.'
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: `${msg} Vous pouvez aussi écrire directement à Carelle via la page /contact.`,
        }
        return next
      })
    } finally {
      setPending(false)
      abortRef.current = null
    }
  }, [messages, pending])

  // Ouverture depuis un bouton du site (éventuellement avec une question)
  const sendRef = useRef(send)
  useEffect(() => { sendRef.current = send }, [send])
  useEffect(() => onAssistantOpen(question => {
    setOpen(true)
    setSeen(true)
    if (question) void sendRef.current(question)
  }), [])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => () => abortRef.current?.abort(), [])

  const reset = () => {
    abortRef.current?.abort()
    setMessages([WELCOME])
    setPending(false)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const closeOnMobile = () => { if (window.innerWidth <= 480) setOpen(false) }
  const last = messages[messages.length - 1]

  return (
    <>
      <AnimatePresence>
        {open && (
          <Panel
            role="dialog"
            aria-label="Assistant IA de Carelle"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom right' }}
          >
            <Header>
              <Avatar aria-hidden="true">C</Avatar>
              <HeaderText>
                <strong>Assistant de Carelle</strong>
                <span>IA · répond à partir de son portfolio</span>
              </HeaderText>
              <IconBtn type="button" onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation">↺</IconBtn>
              <IconBtn type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant">✕</IconBtn>
            </Header>

            <Messages ref={listRef} aria-live="polite">
              {messages.map((m, i) => (
                <Bubble key={i} $user={m.role === 'user'}>
                  {m.content
                    ? renderInline(m.content, closeOnMobile)
                    : <Typing aria-label="L'assistant écrit"><i /><i /><i /></Typing>}
                </Bubble>
              ))}
              {messages.length === 1 && (
                <Suggestions>
                  {SUGGESTIONS.map(s => <Chip key={s} type="button" onClick={() => void send(s)}>{s}</Chip>)}
                </Suggestions>
              )}
            </Messages>

            <Form onSubmit={onSubmit}>
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value.slice(0, 1000))}
                placeholder="Posez votre question…"
                aria-label="Votre question"
                disabled={pending && last.content === ''}
              />
              <Send type="submit" disabled={pending || !input.trim()} aria-label="Envoyer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </Send>
            </Form>
            <Disclaimer>Réponses générées par IA, à vérifier auprès de Carelle si besoin.</Disclaimer>
          </Panel>
        )}
      </AnimatePresence>

      <Fab
        type="button"
        $pulse={!seen}
        onClick={() => { setOpen(o => !o); setSeen(true) }}
        aria-expanded={open}
        aria-label={open ? "Fermer l'assistant" : 'Ouvrir l\'assistant IA'}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
      >
        {open
          ? <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1 }}>✕</span>
          : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
            </svg>
          )}
        <span className="label">{open ? 'Fermer' : 'Une question ?'}</span>
      </Fab>
    </>
  )
}
