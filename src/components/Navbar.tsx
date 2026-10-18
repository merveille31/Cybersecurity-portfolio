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

const Prompt = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.green};
  white-space: nowrap;
`

const Links = styled.nav<{ $open: boolean }>`
  display: flex;
  gap: 1.5rem;
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
    padding: 1rem 1.5rem;
    gap: 1rem;
  }
`

const StyledLink = styled(NavLink)`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.textHeading};
  }

  &.active {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 500;
  }
`

const Burger = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  padding: 0.25rem;
  font-size: 1.4rem;
  line-height: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
    border-radius: 2px;
  }
`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(o => !o), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <Bar>
      <Prompt>~/carelle $</Prompt>
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
          <StyledLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={close}
          >
            {label}
          </StyledLink>
        ))}
      </Links>
    </Bar>
  )
}
