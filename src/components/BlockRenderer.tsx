import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Highlight, themes } from 'prism-react-renderer'
import styled from 'styled-components'
import type { ContentBlock, AlertLevel } from '../types/database'

// ------------------------------------------------------------
// Prose (text block)
// ------------------------------------------------------------
const Prose = styled.div`
  line-height: 1.75;
  color: ${({ theme }) => theme.colors.text};
  max-width: 68ch;

  h1, h2, h3, h4 {
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.text};
    margin: 1.75rem 0 0.5rem;
    line-height: 1.2;
  }
  h2 { font-size: 1.2rem; }
  h3 { font-size: 1.05rem; }

  p { margin: 0.75rem 0; }

  a {
    color: ${({ theme }) => theme.colors.blue};
    text-decoration: underline;
    text-underline-offset: 3px;
    &:hover { color: ${({ theme }) => theme.colors.blueHover}; }
  }

  ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
  li { margin: 0.3rem 0; }

  blockquote {
    border-left: 3px solid ${({ theme }) => theme.colors.green};
    padding-left: 1rem;
    color: ${({ theme }) => theme.colors.muted};
    margin: 1rem 0;
  }

  code {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.83em;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 1px 5px;
    border-radius: ${({ theme }) => theme.radius.sm};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    overflow-x: auto;
    display: block;
  }
  th, td {
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 0.4rem 0.75rem;
    text-align: left;
  }
  th { background: ${({ theme }) => theme.colors.surface}; }

  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin: 1.5rem 0;
  }
`

// ------------------------------------------------------------
// Code block
// ------------------------------------------------------------
const CodeWrap = styled.div`
  margin: 1.25rem 0;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
`

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.875rem;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const LangLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.muted};
`

const CopyBtn = styled.button<{ $copied: boolean }>`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ $copied, theme }) => $copied ? theme.colors.success : theme.colors.muted};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`

const Pre = styled.pre`
  margin: 0;
  padding: 1rem 0.875rem;
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  line-height: 1.65;
  background: ${({ theme }) => theme.colors.bg} !important;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 2px;
  }
`

function CodeBlock({ lang, value }: { lang: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [value])

  return (
    <CodeWrap>
      <CodeHeader>
        <LangLabel>{lang || 'code'}</LangLabel>
        <CopyBtn $copied={copied} onClick={copy} aria-label="Copier le code">
          {copied ? '✓ copié' : 'copier'}
        </CopyBtn>
      </CodeHeader>
      <Highlight theme={themes.nightOwl} code={value.trimEnd()} language={lang || 'text'}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <Pre>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </Pre>
        )}
      </Highlight>
    </CodeWrap>
  )
}

// ------------------------------------------------------------
// Image block
// ------------------------------------------------------------
const FigureWrap = styled.figure`
  margin: 1.25rem 0;
  text-align: center;

  img {
    max-width: 100%;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  figcaption {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.muted};
  }
`

// ------------------------------------------------------------
// Alert block — couleurs du thème
// ------------------------------------------------------------
const ALERT_META: Record<AlertLevel, { color: string; icon: string }> = {
  info:    { color: '#3D8BFF', icon: 'ℹ' },
  warning: { color: '#FFC542', icon: '⚠' },
  danger:  { color: '#FF5470', icon: '✕' },
}

const AlertWrap = styled.div<{ $color: string }>`
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ $color }) => $color}55;
  background: ${({ $color }) => $color}0f;
  margin: 1.25rem 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};

  .icon {
    color: ${({ $color }) => $color};
    flex-shrink: 0;
    font-style: normal;
  }
`

// ------------------------------------------------------------
// BlockRenderer
// ------------------------------------------------------------
export default function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return (
              <Prose key={i}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  allowedElements={[
                    'p','br','strong','em','del','a','ul','ol','li',
                    'h1','h2','h3','h4','blockquote','code','pre',
                    'table','thead','tbody','tr','th','td','hr','img',
                  ]}
                  unwrapDisallowed
                >
                  {block.value}
                </ReactMarkdown>
              </Prose>
            )

          case 'code':
            return <CodeBlock key={i} lang={block.lang} value={block.value} />

          case 'image':
            return (
              <FigureWrap key={i}>
                <img src={block.url} alt={block.caption ?? ''} loading="lazy" decoding="async" />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </FigureWrap>
            )

          case 'alert': {
            const meta = ALERT_META[block.level]
            return (
              <AlertWrap key={i} $color={meta.color} role="note">
                <em className="icon" aria-hidden="true">{meta.icon}</em>
                <span>{block.value}</span>
              </AlertWrap>
            )
          }

          default:
            return null
        }
      })}
    </>
  )
}
