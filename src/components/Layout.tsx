import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import Navbar from './Navbar'
import Footer from './Footer'
import PageTransition from './PageTransition'

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`

export default function Layout() {
  const location = useLocation()

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
      <Footer />
    </>
  )
}
