import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Writeups from './pages/Writeups'
import WriteupsDetail from './pages/WriteupsDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// L'admin n'est téléchargée que lorsqu'on visite /admin
const Admin = lazy(() => import('./pages/Admin'))

const AdminFallback = (
  <div style={{
    padding: '2rem',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#FF6B6B',
    fontSize: '0.9rem',
  }}>
    <p>Une erreur s'est produite dans l'interface d'administration.</p>
    <button
      onClick={() => window.location.reload()}
      style={{
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        background: '#FF4FA3',
        color: '#140A1E',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      Recharger
    </button>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projets" element={<Projects />} />
        <Route path="projets/:slug" element={<ProjectDetail />} />
        <Route path="writeups" element={<Writeups />} />
        <Route path="writeups/:slug" element={<WriteupsDetail />} />
        <Route path="a-propos" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route
          path="admin/*"
          element={
            <ErrorBoundary fallback={AdminFallback}>
              <Suspense fallback={null}>
                <Admin />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
