import { useState, useRef, useEffect, useCallback, useReducer, useId } from 'react'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import type { Profile, Project, Writeup, Certification } from '../types/database'

// ------------------------------------------------------------
// Types internes
// ------------------------------------------------------------
type OutputLine =
  | { kind: 'input'; text: string }
  | { kind: 'output'; nodes: React.ReactNode }
  | { kind: 'error'; text: string }

export interface TerminalData {
  profile: Profile | null
  projects: Project[]
  writeups: Writeup[]
  certifications: Certification[]
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`

const Outer = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 2px;
  background: ${({ theme }) => theme.colors.gradient};

  &::before {
    content: '';
    position: absolute;
    inset: -16px;
    border-radius: calc(${({ theme }) => theme.radius.xl} + 16px);
    background: ${({ theme }) => theme.colors.gradient};
    opacity: 0.15;
    filter: blur(24px);
    z-index: -1;
    pointer-events: none;
  }
`

const Inner = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  border-radius: calc(${({ theme }) => theme.radius.xl} - 2px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`

const Dot = styled.span<{ $c: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $c }) => $c};
  flex-shrink: 0;
`

const TitleText = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.muted};
  margin-left: 4px;
`

const OutputArea = styled.div`
  padding: 0.875rem 1rem;
  height: 240px;
  overflow-y: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  line-height: 1.75;
  display: flex;
  flex-direction: column;
  gap: 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 2px;
  }
`

const InputEcho = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  &::before { content: '$ '; color: ${({ theme }) => theme.colors.green}; }
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.danger};
`

const OutputText = styled.div`
  color: ${({ theme }) => theme.colors.text};
  padding-left: 0.1rem;
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  gap: 0.5rem;
  flex-shrink: 0;
`

const PromptSign = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.green};
  flex-shrink: 0;
  user-select: none;
`

const TextInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  caret-color: ${({ theme }) => theme.colors.green};
  min-width: 0;
`

const Cursor = styled.span`
  display: inline-block;
  width: 7px;
  height: 0.9em;
  background: ${({ theme }) => theme.colors.green};
  animation: ${blink} 1s step-end infinite;
  vertical-align: text-bottom;
  flex-shrink: 0;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`

const SuggestionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding: 0.5rem 1rem 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const SugBtn = styled.button`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover, &:focus-visible {
    border-color: ${({ theme }) => theme.colors.green};
    color: ${({ theme }) => theme.colors.green};
    outline: none;
  }
`

const TermLink = styled(Link)`
  color: ${({ theme }) => theme.colors.blue};
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: ${({ theme }) => theme.colors.blueHover}; }
`

// ------------------------------------------------------------
// Commandes autorisées
// ------------------------------------------------------------
const COMMANDS = ['help', 'whoami', 'ls projets', 'ls blog', 'cat certifications', 'contact', 'clear'] as const
const MAX_LEN = 100

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
}

function buildResponse(raw: string, data: TerminalData): OutputLine {
  const cmd = raw.trim().toLowerCase()

  if (cmd === 'help') {
    return {
      kind: 'output',
      nodes: (
        <span>
          {'Commandes : '}
          {(['whoami', 'ls projets', 'ls blog', 'cat certifications', 'contact', 'clear'] as const).map((c, i, a) => (
            <span key={c}>
              <span style={{ color: '#22E58A' }}>{c}</span>
              {i < a.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      ),
    }
  }

  if (cmd === 'whoami') {
    const p = data.profile
    if (!p) return { kind: 'output', nodes: <span>Profil non disponible.</span> }
    return {
      kind: 'output',
      nodes: <span>{p.full_name} — {p.headline}{p.location ? ` · ${p.location}` : ''}</span>,
    }
  }

  if (cmd === 'ls projets') {
    if (!data.projects.length) return { kind: 'output', nodes: <span>Aucun projet publié.</span> }
    return {
      kind: 'output',
      nodes: (
        <span>
          {data.projects.map((p, i) => (
            <span key={p.slug}>
              <TermLink to={`/projets/${p.slug}`}>{p.title}</TermLink>
              {i < data.projects.length - 1 ? '  ' : ''}
            </span>
          ))}
        </span>
      ),
    }
  }

  if (cmd === 'ls blog' || cmd === 'ls writeups') {
    if (!data.writeups.length) return { kind: 'output', nodes: <span>Aucun article publié.</span> }
    return {
      kind: 'output',
      nodes: (
        <span>
          {data.writeups.map((w, i) => (
            <span key={w.slug}>
              <TermLink to={`/blog/${w.slug}`}>{w.title}</TermLink>
              {i < data.writeups.length - 1 ? '  ' : ''}
            </span>
          ))}
        </span>
      ),
    }
  }

  if (cmd === 'cat certifications') {
    if (!data.certifications.length) return { kind: 'output', nodes: <span>Aucune certification.</span> }
    return {
      kind: 'output',
      nodes: (
        <span>
          {data.certifications.map((c, i) => (
            <span key={c.id}>
              {c.name} ({c.issuer}){c.obtained_at ? ` · ${fmtDate(c.obtained_at)}` : ' · en cours'}
              {i < data.certifications.length - 1 ? <br /> : null}
            </span>
          ))}
        </span>
      ),
    }
  }

  if (cmd === 'contact') {
    return {
      kind: 'output',
      nodes: <span><TermLink to="/contact">Ouvrir le formulaire de contact</TermLink></span>,
    }
  }

  return { kind: 'error', text: `commande introuvable : "${raw.slice(0, 40)}" — tapez help` }
}

// ------------------------------------------------------------
// Reducer
// ------------------------------------------------------------
type State = { lines: OutputLine[]; history: string[]; histIdx: number }
type Action =
  | { type: 'run'; cmd: string; response: OutputLine }
  | { type: 'clear' }
  | { type: 'histUp' | 'histDown' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'clear':
      return { lines: [], history: state.history, histIdx: -1 }
    case 'run': {
      const lines: OutputLine[] = [
        ...state.lines,
        { kind: 'input', text: action.cmd },
        action.response,
      ]
      const history = action.cmd ? [action.cmd, ...state.history.slice(0, 49)] : state.history
      return { lines, history, histIdx: -1 }
    }
    case 'histUp':
      return { ...state, histIdx: Math.min(state.histIdx + 1, state.history.length - 1) }
    case 'histDown':
      return { ...state, histIdx: Math.max(state.histIdx - 1, -1) }
    default:
      return state
  }
}

// ------------------------------------------------------------
// Composant
// ------------------------------------------------------------
interface Props {
  data: TerminalData
  autoplay?: boolean
}

export default function Terminal({ data, autoplay = true }: Props) {
  const [state, dispatch] = useReducer(reducer, { lines: [], history: [], histIdx: -1 })
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const logId = useId()

  // Scroll bas à chaque nouvelle ligne
  useEffect(() => {
    const el = outputRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.lines])

  // Autoplay : tape "whoami" au montage
  useEffect(() => {
    if (!autoplay) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      dispatch({ type: 'run', cmd: 'whoami', response: buildResponse('whoami', data) })
      return
    }
    const target = 'whoami'
    let i = 0
    const id = setInterval(() => {
      i++
      setValue(target.slice(0, i))
      if (i >= target.length) {
        clearInterval(id)
        setTimeout(() => {
          dispatch({ type: 'run', cmd: target, response: buildResponse(target, data) })
          setValue('')
        }, 380)
      }
    }, 110)
    return () => clearInterval(id)
  // data est stable au montage, on ne veut pas relancer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay])

  const run = useCallback((cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return
    if (trimmed.toLowerCase() === 'clear') {
      dispatch({ type: 'clear' })
      setValue('')
      return
    }
    dispatch({ type: 'run', cmd: trimmed, response: buildResponse(trimmed, data) })
    setValue('')
  }, [data])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(value)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      dispatch({ type: 'histUp' })
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      dispatch({ type: 'histDown' })
    }
  }, [run, value])

  // Synchronise la valeur avec l'historique navigué
  useEffect(() => {
    if (state.histIdx === -1) return
    setValue(state.history[state.histIdx] ?? '')
  }, [state.histIdx, state.history])

  return (
    <Outer role="region" aria-label="Terminal interactif">
      <Inner>
        <TitleBar aria-hidden="true">
          <Dot $c="#FF5470" />
          <Dot $c="#FFC542" />
          <Dot $c="#22E58A" />
          <TitleText>carelle — bash</TitleText>
        </TitleBar>

        <OutputArea
          ref={outputRef}
          id={logId}
          role="log"
          aria-live="polite"
          aria-label="Sortie du terminal"
          aria-atomic="false"
        >
          {state.lines.map((line, i) => {
            if (line.kind === 'input') return <InputEcho key={i}>{line.text}</InputEcho>
            if (line.kind === 'error') return <ErrorText key={i}>{line.text}</ErrorText>
            return <OutputText key={i}>{line.nodes}</OutputText>
          })}
        </OutputArea>

        <InputRow onClick={() => inputRef.current?.focus()}>
          <PromptSign aria-hidden="true">$</PromptSign>
          <TextInput
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Saisir une commande"
            aria-controls={logId}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={MAX_LEN}
          />
          {!focused && <Cursor aria-hidden="true" />}
        </InputRow>

        <SuggestionsRow aria-label="Commandes suggérées">
          {COMMANDS.map(cmd => (
            <SugBtn
              key={cmd}
              type="button"
              onClick={() => { run(cmd); inputRef.current?.focus() }}
              aria-label={`Exécuter : ${cmd}`}
            >
              {cmd}
            </SugBtn>
          ))}
        </SuggestionsRow>
      </Inner>
    </Outer>
  )
}
