import { useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/projets', label: 'Projets' },
  { to: '/writeups', label: 'Write-ups' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
]

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
`

const Logo = styled(NavLink)`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  text-decoration: none;
  white-space: nowrap;
  letter-spacing: -0.01em;

  .dollar { color: ${({ theme }) => theme.colors.magenta}; }
`

const Links = styled.nav<{ $open: boolean }>`
  display: flex;
  gap: 1.75rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
    flex-direction: column;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.surface};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding: 1.25rem 1.5rem;
    gap: 1.25rem;
  }
`

const StyledLink = styled(NavLink)`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.muted};
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.text}; }

  &.active {
    color: ${({ theme }) => theme.colors.magenta};
  }
`

const Burger = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.muted};
  padding: 0.25rem;
  font-size: 1.3rem;
  line-height: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(o => !o), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <Bar>
      <Logo to="/" onClick={close} aria-label="Accueil">
        ~/carelle <span className="dollar">$</span>
      </Logo>
      <Burger
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {open ? '✕' : '☰'}
      </Burger>
      <Links id="nav-links" $open={open} role="navigation" aria-label="Navigation principale">
        {NAV_LINKS.map(({ to, label }) => (
          <StyledLink key={to} to={to} end={to === '/'} onClick={close}>
            {label}
          </StyledLink>
        ))}
      </Links>
    </Bar>
  )
}
