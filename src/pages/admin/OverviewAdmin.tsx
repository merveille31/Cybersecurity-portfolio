import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAdminQuery, adminFetchOverview } from '../../lib/adminQueries'
import { Skeleton, ErrorMessage } from '../../components/ui'
import { Card, CardTitle, Muted } from '../../components/admin/form'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`

const StatCard = styled(Link)<{ $alert?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.15rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme, $alert }) => ($alert ? 'rgba(61, 139, 255, 0.6)' : theme.colors.border)};
  background: ${({ theme, $alert }) => ($alert ? theme.colors.blueDim : theme.colors.surface)};
  color: inherit;
  transition: border-color 0.15s, transform 0.15s;

  &:hover { color: inherit; border-color: ${({ theme }) => theme.colors.green}; transform: translateY(-2px); }

  strong {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 2rem;
    line-height: 1;
  }
  span { font-size: 0.85rem; color: ${({ theme }) => theme.colors.muted}; }
`

const Checklist = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem 1.5rem;

  li { display: flex; align-items: center; gap: 0.55rem; font-size: 0.9rem; }
`

const Dot = styled.span<{ $ok: boolean }>`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme, $ok }) => ($ok ? theme.colors.onAccent : theme.colors.warning)};
  background: ${({ theme, $ok }) => ($ok ? theme.colors.green : 'rgba(255, 197, 66, 0.15)')};
`

const Warning = styled.div`
  padding: 1rem 1.15rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid rgba(255, 197, 66, 0.45);
  background: rgba(255, 197, 66, 0.08);
  font-size: 0.875rem;
  line-height: 1.6;

  code { font-size: 0.8rem; }
`

export default function OverviewAdmin() {
  const q = useAdminQuery(adminFetchOverview)
  if (q.status === 'loading') return <Skeleton $h="16rem" $radius="16px" />
  if (q.status === 'error') return <ErrorMessage message={q.error} />
  const o = q.data
  const todo = o.profileComplete.filter(c => !c.ok).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {o.timeline === null && (
        <Warning>
          <strong>Base de données à mettre à jour.</strong> Le parcours et les modules ont besoin de la migration{' '}
          <code>supabase/migrations/004_parcours_modules.sql</code> : copiez son contenu dans Supabase →
          SQL Editor → Run. Une seule fois suffit.
        </Warning>
      )}

      <Grid>
        <StatCard to="/admin/messages" $alert={o.messages.unread > 0}>
          <strong>{o.messages.unread}</strong>
          <span>message{o.messages.unread > 1 ? 's' : ''} non lu{o.messages.unread > 1 ? 's' : ''} · {o.messages.total} au total</span>
        </StatCard>
        <StatCard to="/admin/projets">
          <strong>{o.projects.published}</strong>
          <span>projets publiés · {o.projects.total - o.projects.published} brouillon(s)</span>
        </StatCard>
        <StatCard to="/admin/blog">
          <strong>{o.writeups.published}</strong>
          <span>articles publiés · {o.writeups.total - o.writeups.published} brouillon(s)</span>
        </StatCard>
        <StatCard to="/admin/parcours">
          <strong>{o.timeline ?? '—'}</strong>
          <span>étapes de parcours</span>
        </StatCard>
        <StatCard to="/admin/certifications">
          <strong>{o.certifications}</strong>
          <span>certifications</span>
        </StatCard>
      </Grid>

      <Card>
        <CardTitle>{todo === 0 ? 'Profil complet 🎉' : `Profil : ${todo} élément(s) à compléter`}</CardTitle>
        <Checklist>
          {o.profileComplete.map(item => (
            <li key={item.label}>
              <Dot $ok={item.ok} aria-hidden="true">{item.ok ? '✓' : '!'}</Dot>
              {item.label}
            </li>
          ))}
        </Checklist>
        <Muted>
          Les éléments en jaune utilisent encore les données d'exemple. Complétez-les dans l'onglet{' '}
          <Link to="/admin/profil">Profil</Link>.
        </Muted>
      </Card>
    </div>
  )
}
