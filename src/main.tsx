import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { HelmetProvider } from 'react-helmet-async'
import { theme } from './styles/theme'
import GlobalStyle from './styles/GlobalStyle'
import { ErrorBoundary, MisconfiguredScreen } from './components/ErrorBoundary'
import { supabaseMisconfigured } from './lib/supabase'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <ErrorBoundary>
          {supabaseMisconfigured
            ? <MisconfiguredScreen />
            : (
              <BrowserRouter>
                <App />
              </BrowserRouter>
            )
          }
        </ErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
