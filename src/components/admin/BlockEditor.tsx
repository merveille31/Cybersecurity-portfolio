import { useState } from 'react'
import styled from 'styled-components'
import BlockRenderer from '../BlockRenderer'
import { Card, CardTitle, Toolbar, Actions, Button, Field, Input, Select, Textarea, Muted } from './form'
import type { ContentBlock, AlertLevel } from '../../types/database'

// Éditeur de la colonne `content` (tableau de blocs) avec aperçu
// rendu par le même composant que les pages publiques.

const NEW_BLOCK: Record<ContentBlock['type'], () => ContentBlock> = {
  text:  () => ({ type: 'text', value: '' }),
  code:  () => ({ type: 'code', lang: 'bash', value: '' }),
  image: () => ({ type: 'image', url: '', caption: '' }),
  alert: () => ({ type: 'alert', level: 'info', value: '' }),
}

const TYPE_LABEL: Record<ContentBlock['type'], string> = {
  text: 'Texte',
  code: 'Code',
  image: 'Image',
  alert: 'Alerte',
}

const LANGS = ['bash', 'python', 'javascript', 'typescript', 'c', 'cpp', 'php', 'sql', 'html', 'json', 'yaml', 'text']

const BlockCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg};
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const BlockType = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.magenta};
`

const ModeSwitch = styled.div`
  display: inline-flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;

  button {
    background: none;
    border: none;
    padding: 0.35rem 0.8rem;
    font: inherit;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.muted};
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.violetDim};
    color: ${({ theme }) => theme.colors.text};
  }
`

function BlockFields({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  switch (block.type) {
    case 'text':
      return (
        <Field label="Contenu" hint="Markdown : ## titre, **gras**, `code`, listes, liens, tableaux.">
          {id => <Textarea id={id} rows={6} value={block.value} onChange={e => onChange({ ...block, value: e.target.value })} />}
        </Field>
      )
    case 'code':
      return (
        <>
          <Field label="Langage">
            {id => (
              <Select id={id} value={block.lang} onChange={e => onChange({ ...block, lang: e.target.value })}>
                {!LANGS.includes(block.lang) && <option value={block.lang}>{block.lang}</option>}
                {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Code">
            {id => <Textarea id={id} $mono rows={8} spellCheck={false} value={block.value} onChange={e => onChange({ ...block, value: e.target.value })} />}
          </Field>
        </>
      )
    case 'image':
      return (
        <>
          <Field label="URL de l'image">
            {id => <Input id={id} type="url" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })} />}
          </Field>
          <Field label="Légende (facultatif)">
            {id => <Input id={id} value={block.caption ?? ''} onChange={e => onChange({ ...block, caption: e.target.value })} />}
          </Field>
        </>
      )
    case 'alert':
      return (
        <>
          <Field label="Niveau">
            {id => (
              <Select id={id} value={block.level} onChange={e => onChange({ ...block, level: e.target.value as AlertLevel })}>
                <option value="info">Info</option>
                <option value="warning">Avertissement</option>
                <option value="danger">Danger</option>
              </Select>
            )}
          </Field>
          <Field label="Message">
            {id => <Textarea id={id} rows={3} value={block.value} onChange={e => onChange({ ...block, value: e.target.value })} />}
          </Field>
        </>
      )
  }
}

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const update = (i: number, block: ContentBlock) => onChange(blocks.map((b, j) => (j === i ? block : b)))
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...blocks]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }

  return (
    <Card>
      <Toolbar>
        <CardTitle>Contenu</CardTitle>
        <ModeSwitch role="group" aria-label="Mode d'affichage">
          <button type="button" aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>Édition</button>
          <button type="button" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>Aperçu</button>
        </ModeSwitch>
      </Toolbar>

      {mode === 'preview'
        ? (blocks.length > 0 ? <BlockRenderer blocks={blocks} /> : <Muted>Aucun bloc pour l'instant.</Muted>)
        : (
          <>
            {blocks.length === 0 && <Muted>Aucun bloc. Ajoutez-en un ci-dessous.</Muted>}
            {blocks.map((block, i) => (
              <BlockCard key={i}>
                <Toolbar>
                  <BlockType>#{i + 1} · {TYPE_LABEL[block.type]}</BlockType>
                  <Actions>
                    <Button type="button" $variant="ghost" $small disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter le bloc">↑</Button>
                    <Button type="button" $variant="ghost" $small disabled={i === blocks.length - 1} onClick={() => move(i, 1)} aria-label="Descendre le bloc">↓</Button>
                    <Button type="button" $variant="danger" $small onClick={() => remove(i)}>Supprimer</Button>
                  </Actions>
                </Toolbar>
                <BlockFields block={block} onChange={b => update(i, b)} />
              </BlockCard>
            ))}
            <Actions>
              {(Object.keys(NEW_BLOCK) as ContentBlock['type'][]).map(type => (
                <Button key={type} type="button" $variant="ghost" $small onClick={() => onChange([...blocks, NEW_BLOCK[type]()])}>
                  + {TYPE_LABEL[type]}
                </Button>
              ))}
            </Actions>
          </>
        )}
    </Card>
  )
}
