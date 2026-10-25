import { useState, useId, type ReactNode, type KeyboardEvent } from 'react'
import styled, { css } from 'styled-components'
import { Tag } from '../ui'

// Briques de formulaire partagées par les écrans d'administration.

// ------------------------------------------------------------
// Mise en page
// ------------------------------------------------------------

export const Card = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1rem;
  }
`

export const CardTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
`

export const Row = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 2}, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`

export const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
`

export const Muted = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.85rem;
`

// ------------------------------------------------------------
// Champs
// ------------------------------------------------------------

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 500;
`

const Hint = styled.span<{ $error?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.muted)};
`

const inputStyle = css`
  width: 100%;
  padding: 0.55rem 0.8rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.violet};
  }
`

export const Input = styled.input`${inputStyle}`
export const Select = styled.select`${inputStyle}`
export const Textarea = styled.textarea<{ $mono?: boolean }>`
  ${inputStyle}
  resize: vertical;
  min-height: 6rem;
  line-height: 1.55;
  ${({ $mono, theme }) => $mono && css`font-family: ${theme.fonts.mono}; font-size: 0.8rem;`}
`

/** Champ avec libellé, aide et message d'erreur. `children` reçoit l'id à poser sur le contrôle. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <FieldWrap>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {error ? <Hint $error>{error}</Hint> : hint && <Hint>{hint}</Hint>}
    </FieldWrap>
  )
}

const CheckLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;

  input { accent-color: ${({ theme }) => theme.colors.magenta}; width: 1rem; height: 1rem; }
`

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <CheckLabel>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </CheckLabel>
  )
}

// ------------------------------------------------------------
// Saisie de tags : Entrée ou virgule pour ajouter, × pour retirer
// ------------------------------------------------------------

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  &:empty { display: none; }
`

const RemovableTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1;
    &:hover { color: ${({ theme }) => theme.colors.danger}; }
  }
`

export function TagInput({
  id,
  value,
  onChange,
  placeholder = 'Ajouter puis Entrée',
}: {
  id?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const tag = draft.trim().replace(/,$/, '').trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <FieldWrap>
      <TagList>
        {value.map(tag => (
          <RemovableTag key={tag}>
            {tag}
            <button type="button" aria-label={`Retirer ${tag}`} onClick={() => onChange(value.filter(t => t !== tag))}>
              ×
            </button>
          </RemovableTag>
        ))}
      </TagList>
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
      />
    </FieldWrap>
  )
}

// ------------------------------------------------------------
// Boutons
// ------------------------------------------------------------

type Variant = 'primary' | 'ghost' | 'danger'

export const Button = styled.button<{ $variant?: Variant; $small?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: ${({ $small }) => ($small ? '0.3rem 0.7rem' : '0.55rem 1.2rem')};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: inherit;
  font-size: ${({ $small }) => ($small ? '0.8rem' : '0.9rem')};
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  ${({ $variant = 'primary', theme }) => {
    if ($variant === 'primary') return css`
      background: ${theme.colors.magenta};
      color: #140A1E;
      border: 1px solid ${theme.colors.magenta};
      &:hover:not(:disabled) { background: ${theme.colors.magentaHover}; color: #140A1E; }
    `
    if ($variant === 'danger') return css`
      background: transparent;
      color: ${theme.colors.danger};
      border: 1px solid ${theme.colors.danger}66;
      &:hover:not(:disabled) { background: ${theme.colors.danger}1a; }
    `
    return css`
      background: transparent;
      color: ${theme.colors.muted};
      border: 1px solid ${theme.colors.border};
      &:hover:not(:disabled) { color: ${theme.colors.text}; border-color: ${theme.colors.violet}; }
    `
  }}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// ------------------------------------------------------------
// Bandeau de retour (succès / erreur)
// ------------------------------------------------------------

const NoticeWrap = styled.div<{ $kind: 'success' | 'error' }>`
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.875rem;
  ${({ $kind, theme }) => {
    const c = $kind === 'success' ? theme.colors.success : theme.colors.danger
    return css`
      color: ${c};
      border: 1px solid ${c}55;
      background: ${c}12;
    `
  }}
`

export type NoticeState = { kind: 'success' | 'error'; text: string } | null

export function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null
  return (
    <NoticeWrap $kind={notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}>
      {notice.kind === 'success' ? '✓ ' : '⚠ '}
      {notice.text}
    </NoticeWrap>
  )
}

// ------------------------------------------------------------
// Pastille de statut publié / brouillon
// ------------------------------------------------------------

export const StatusPill = styled.span<{ $on: boolean }>`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  white-space: nowrap;
  color: ${({ theme, $on }) => ($on ? theme.colors.success : theme.colors.warning)};
  border: 1px solid ${({ theme, $on }) => ($on ? theme.colors.success : theme.colors.warning)}55;
`
