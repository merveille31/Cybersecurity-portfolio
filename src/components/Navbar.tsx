import { useState, useCallback, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import styled from 'styled-components'
import { useQuery, fetchProfile } from '../lib/queries'
import { isOn } from '../lib/modules'

// Trois onglets + le bouton de contact. Projets et Blog suivent les modules
// activés dans l'admin.
const NAV_LINKS = [
  { to: '/', label: 'Accueil', module: null },
  { to: '/projets', label: 'Projets', module: 'projects' },
  { to: '/blog', label: 'Blog', module: 'blog' },
]

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5, 9, 13, 0.72);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.lg};
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 1rem;
  }
`

const Logo = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;

  &:hover { color: ${({ theme }) => theme.colors.text}; }

  .tilde { color: ${({ theme }) => theme.colors.blue}; }
  .cursor {
    display: inline-block;
    width: 0.55em;
    height: 1.05em;
    margin-left: 0.2rem;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.green};
    box-shadow: 0 0 12px rgba(34, 229, 138, 0.7);
  }
`

const Links = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const StyledLink = styled(NavLink)`
  position: relative;
  padding: 0.45rem 0.85rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.full};
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
  &.active { color: ${({ theme }) => theme.colors.text}; }

  span { position: relative; z-index: 1; }
`

const ActivePill = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.greenDim};
  box-shadow: inset 0 0 0 1px rgba(34, 229, 138, 0.35);
`

const ContactBtn = styled(NavLink)`
  margin-left: 0.75rem;
  padding: 0.5rem 1.1rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.onAccent};
  background: ${({ theme }) => theme.colors.green};
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.greenHover};
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
    transform: translateY(-1px);
  }
`

const Burger = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const MobileMenu = styled(motion.nav)`
  display: none;
  overflow: hidden;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }

  ul {
    list-style: none;
    padding: 0.75rem 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`

const MobileLink = styled(NavLink)`
  display: block;
  padding: 0.75rem 0.9rem;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 500;

  &.active {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.greenDim};
  }
`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const { pathname } = useLocation()
  const toggle = useCallback(() => setOpen(o => !o), [])
  const close = useCallback(() => setOpen(false), [])

  // Échap ferme le menu mobile
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const profileQ = useQuery(useCallback(() => fetchProfile(), []))
  const profile = profileQ.status === 'success' ? profileQ.data : null
  const links = NAV_LINKS.filter(l => !l.module || isOn(profile, l.module))

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  return (
    <Bar>
      <Inner>
        <Logo to="/" onClick={close} aria-label="Carelle, retour à l'accueil">
          <span className="tilde">~/</span>carelle<span className="cursor" aria-hidden="true" />
        </Logo>

        <Links aria-label="Navigation principale">
          {links.map(({ to, label }) => (
            <StyledLink key={to} to={to} end={to === '/'}>
              {isActive(to) && (
                <ActivePill
                  layoutId="nav-active"
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span>{label}</span>
            </StyledLink>
          ))}
          <ContactBtn to="/contact">Me contacter</ContactBtn>
        </Links>

        <Burger
          onClick={toggle}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? '✕' : '☰'}
        </Burger>
      </Inner>

      <AnimatePresence initial={false}>
        {open && (
          <MobileMenu
            id="mobile-nav"
            aria-label="Navigation principale"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
          >
            <ul>
              {[...links, { to: '/contact', label: 'Me contacter' }].map(({ to, label }) => (
                <li key={to}>
                  <MobileLink to={to} end={to === '/'} onClick={close}>{label}</MobileLink>
                </li>
              ))}
            </ul>
          </MobileMenu>
        )}
      </AnimatePresence>
    </Bar>
  )
}
