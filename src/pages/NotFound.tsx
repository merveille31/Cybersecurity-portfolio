import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'

const Wrap = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  padding: 3rem 0;
`

const Code = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.green};
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.75rem;
`

const Msg = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 2rem;
  font-size: 0.9rem;
`

const Cmd = styled.p`
  color: ${({ theme }) => theme.colors.cyan};
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
`

const Output = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`

const Back = styled(Link)`
  color: ${({ theme }) => theme.colors.blue};
  font-size: 0.875rem;
  &:hover { color: ${({ theme }) => theme.colors.blueHover}; }
`

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 · Carelle</title></Helmet>
      <Wrap>
        <Code>404</Code>
        <Msg>bash: page: command not found</Msg>
        <Cmd>$ ls /pages</Cmd>
        <Output>accueil  projets  writeups  a-propos  contact</Output>
        <Cmd>$ cd ~</Cmd>
        <Back to="/">retour à l'accueil</Back>
      </Wrap>
    </>
  )
}
