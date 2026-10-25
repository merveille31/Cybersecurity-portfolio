import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useQuery, fetchProfile } from '../lib/queries'
import { SocialLinks } from './ProfileLinks'

const Bar = styled.footer`
  margin-top: 5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(11, 19, 26, 0.6);
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.lg};
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    padding: 2rem 1rem;
  }
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  strong { font-family: ${({ theme }) => theme.fonts.heading}; font-size: 1.1rem; }
  p { color: ${({ theme }) => theme.colors.muted}; font-size: 0.875rem; max-width: 36ch; }
`

const Nav = styled.nav`
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 0.5rem 2rem;

  a { color: ${({ theme }) => theme.colors.muted}; font-size: 0.875rem; }
  a:hover { color: ${({ theme }) => theme.colors.text}; }
`

const Bottom = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.lg};
  margin: 0 auto;
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.muted};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  .prompt { color: ${({ theme }) => theme.colors.green}; }
`

const YEAR = new Date().getFullYear()

export default function Footer() {
  const profileQ = useQuery(useCallback(() => fetchProfile(), []))
  const profile = profileQ.status === 'success' ? profileQ.data : null
  const name = profile?.full_name || 'Carelle'

  return (
    <Bar>
      <Inner>
        <Brand>
          <strong>{name}</strong>
          <p>{profile?.headline || 'Cybersécurité offensive et défensive.'}</p>
        </Brand>
        <Nav aria-label="Liens du pied de page">
          <Link to="/a-propos">Parcours</Link>
          <Link to="/projets">Projets</Link>
          <Link to="/writeups">Write-ups CTF</Link>
          <Link to="/contact">Contact</Link>
          {profile?.cv_url && <a href={profile.cv_url} target="_blank" rel="noopener noreferrer">CV (PDF)</a>}
        </Nav>
        <SocialLinks links={profile?.links} compact />
      </Inner>
      <Bottom>
        <span>© {YEAR} {name}</span>
        <span><span className="prompt">$</span> echo "merci de votre visite"</span>
      </Bottom>
    </Bar>
  )
}
