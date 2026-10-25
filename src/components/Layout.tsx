import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import Navbar from './Navbar'
import Footer from './Footer'
import PageTransition from './PageTransition'
import ChatAssistant from './ChatAssistant'

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ theme }) => theme.breakpoints.lg};
  margin: 0 auto;
  padding: 2.5rem 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem 1rem;
  }
`

export default function Layout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      <Navbar />
      <Main>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </Main>
      {!isAdmin && <Footer />}
      {!isAdmin && <ChatAssistant />}
    </>
  )
}
