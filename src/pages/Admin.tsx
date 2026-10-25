import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import type { Session } from '@supabase/supabase-js'
import { useSession, useIsAdmin, signOut } from '../lib/auth'
import { Skeleton, ErrorMessage } from '../components/ui'
import { Button, Card, Muted } from '../components/admin/form'
import Login from './admin/Login'
import ProfileAdmin from './admin/ProfileAdmin'
import { ProjectsList, ProjectEditor } from './admin/ProjectsAdmin'
import { WriteupsList, WriteupEditor } from './admin/WriteupsAdmin'
import CertificationsAdmin from './admin/CertificationsAdmin'

// Chargée à la demande (React.lazy dans App.tsx) : rien de tout ceci
// n'alourdit le site public.

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`

const Title = styled.h1`
  font-size: clamp(1.3rem, 3vw, 1.75rem);
`

const Who = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
  overflow-wrap: anywhere;
`

const Tabs = styled.nav`
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1.75rem;
`

const Tab = styled(NavLink)`
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.muted};
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
  &.active {
    color: ${({ theme }) => theme.colors.text};
    border-bottom-color: ${({ theme }) => theme.colors.magenta};
  }
`

const Center = styled.div`
  max-width: 420px;
  margin: 3rem auto;
  width: 100%;
`

// ------------------------------------------------------------
// Espace admin (utilisateur connecté et administrateur)
// ------------------------------------------------------------
function AdminArea({ session }: { session: Session }) {
  const role = useIsAdmin(session.user.id)

  if (role === 'checking') {
    return <Center><Skeleton $h="8rem" $radius="16px" /></Center>
  }

  if (role !== 'admin') {
    return (
      <Center>
        <Card>
          {role === 'error'
            ? <ErrorMessage message="Impossible de vérifier les droits d'accès." />
            : <h1 style={{ fontSize: '1.3rem' }}>Accès refusé</h1>}
          <Muted>
            Le compte {session.user.email} n'est pas administrateur. Ajoutez son identifiant
            dans la table <code>admins</code> depuis Supabase.
          </Muted>
          <Button $variant="ghost" onClick={() => signOut()}>Se déconnecter</Button>
        </Card>
      </Center>
    )
  }

  return (
    <>
      <Header>
        <div>
          <Title>Administration</Title>
          <Who>{session.user.email}</Who>
        </div>
        <Button $variant="ghost" $small onClick={() => signOut()}>Se déconnecter</Button>
      </Header>

      <Tabs aria-label="Sections de l'administration">
        <Tab to="/admin/profil">Profil</Tab>
        <Tab to="/admin/projets">Projets</Tab>
        <Tab to="/admin/writeups">Write-ups</Tab>
        <Tab to="/admin/certifications">Certifications</Tab>
      </Tabs>

      <Routes>
        <Route index element={<Navigate to="/admin/profil" replace />} />
        <Route path="profil" element={<ProfileAdmin />} />
        <Route path="projets" element={<ProjectsList />} />
        <Route path="projets/nouveau" element={<ProjectEditor />} />
        <Route path="projets/:id" element={<ProjectEditor />} />
        <Route path="writeups" element={<WriteupsList />} />
        <Route path="writeups/nouveau" element={<WriteupEditor />} />
        <Route path="writeups/:id" element={<WriteupEditor />} />
        <Route path="certifications" element={<CertificationsAdmin />} />
        <Route path="*" element={<Navigate to="/admin/profil" replace />} />
      </Routes>
    </>
  )
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function Admin() {
  const auth = useSession()

  return (
    <>
      <Helmet>
        <title>Admin · Carelle</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {auth.status === 'loading'
        ? <Center><Skeleton $h="12rem" $radius="16px" /></Center>
        : auth.session
          ? <AdminArea session={auth.session} />
          : <Login />}
    </>
  )
}
