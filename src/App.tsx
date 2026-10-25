import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Writeups from './pages/Writeups'
import WriteupsDetail from './pages/WriteupsDetail'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// L'admin n'est téléchargée que lorsqu'on visite /admin
const Admin = lazy(() => import('./pages/Admin'))

// Anciennes adresses : /writeups est devenu /blog, /a-propos est sur l'accueil
function LegacyWriteup() {
  const { slug } = useParams()
  return <Navigate to={`/blog/${slug ?? ''}`} replace />
}

const AdminFallback = (
  <div style={{
    padding: '2rem',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#FF5470',
    fontSize: '0.9rem',
  }}>
    <p>Une erreur s'est produite dans l'interface d'administration.</p>
    <button
      onClick={() => window.location.reload()}
      style={{
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        background: '#22E58A',
        color: '#03120B',
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
        <Route path="blog" element={<Writeups />} />
        <Route path="blog/:slug" element={<WriteupsDetail />} />
        <Route path="writeups" element={<Navigate to="/blog" replace />} />
        <Route path="writeups/:slug" element={<LegacyWriteup />} />
        <Route path="a-propos" element={<Navigate to="/#parcours" replace />} />
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
