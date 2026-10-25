import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import styled from 'styled-components'

// ------------------------------------------------------------
// Styles inline-safe (pas de ThemeProvider garanti ici)
// On utilise les valeurs du thème en dur pour ce composant
// de dernier recours — il doit fonctionner même si le ThemeProvider
// n'est pas encore monté.
// ------------------------------------------------------------
const Wrap = styled.div`
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #03120B;
  color: #EAF5F1;
  font-family: 'DM Sans', system-ui, sans-serif;
  text-align: center;
  gap: 1rem;
`

const Code = styled.p`
  font-family: 'Unbounded', system-ui, sans-serif;
  font-size: 3rem;
  font-weight: 700;
  color: #22E58A;
  line-height: 1;
`

const Title = styled.h1`
  font-family: 'Unbounded', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #EAF5F1;
  margin: 0;
`

const Msg = styled.p`
  color: #8DA2AF;
  font-size: 0.95rem;
  max-width: 48ch;
  line-height: 1.65;
  margin: 0;
`

const ReloadBtn = styled.button`
  margin-top: 0.5rem;
  padding: 0.6rem 1.5rem;
  border-radius: 10px;
  border: none;
  background: #22E58A;
  color: #03120B;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #4FF0A6; }
  &:focus-visible {
    outline: 2px solid #3D8BFF;
    outline-offset: 3px;
  }
`

const DevDetail = styled.details`
  margin-top: 1rem;
  max-width: 640px;
  width: 100%;
  text-align: left;

  summary {
    font-size: 0.8rem;
    color: #8DA2AF;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  pre {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: #FF5470;
    background: #0B131A;
    border: 1px solid #192734;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`

// ------------------------------------------------------------
// Props et state
// ------------------------------------------------------------
interface Props {
  children: ReactNode
  /** Rendu alternatif optionnel (ex : pour l'admin) */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

// ------------------------------------------------------------
// ErrorBoundary
// ------------------------------------------------------------
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // On journalise uniquement le type d'erreur, jamais les données utilisateur
    console.error('[ErrorBoundary]', error.name, error.message)
    console.error('[ErrorBoundary] componentStack:', info.componentStack?.slice(0, 300))
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      const isDev = import.meta.env.DEV

      return (
        <Wrap role="alert" aria-live="assertive">
          <Code>!</Code>
          <Title>Une erreur inattendue s'est produite</Title>
          <Msg>
            Quelque chose s'est mal passé. Rechargez la page ou revenez plus tard.
          </Msg>
          <ReloadBtn onClick={() => window.location.reload()}>
            Recharger la page
          </ReloadBtn>
          {isDev && (
            <DevDetail>
              <summary>Détail de l'erreur (développement uniquement)</summary>
              <pre>{this.state.error.name}: {this.state.error.message}{'\n\n'}{this.state.error.stack}</pre>
            </DevDetail>
          )}
        </Wrap>
      )
    }

    return this.props.children
  }
}

// ------------------------------------------------------------
// Écran « Configuration manquante »
// Affiché quand les variables VITE_ sont absentes,
// sans jamais révéler les valeurs ni les noms complets.
// ------------------------------------------------------------
export function MisconfiguredScreen() {
  const isDev = import.meta.env.DEV

  return (
    <Wrap role="alert">
      <Code>⚙</Code>
      <Title>Configuration manquante</Title>
      <Msg>
        {isDev
          ? 'Les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY sont absentes. Créez un fichier .env.local à partir de .env.example.'
          : 'Le site n\'est pas correctement configuré. Contactez l\'administrateur.'}
      </Msg>
      {isDev && (
        <DevDetail>
          <summary>Comment corriger</summary>
          <pre>{'cp .env.example .env.local\n# puis remplissez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY'}</pre>
        </DevDetail>
      )}
    </Wrap>
  )
}
