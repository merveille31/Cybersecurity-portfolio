import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'

const Wrap = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  padding: 2rem 0;
`

const Code = styled.p`
  color: ${({ theme }) => theme.colors.red};
  font-size: 4rem;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 0.5rem;
`

const Msg = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 1.5rem;
`

const Cmd = styled.p`
  color: ${({ theme }) => theme.colors.green};
  margin-bottom: 0.5rem;
`

const Back = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  &:hover { text-decoration: underline; }
`

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 · Carelle</title></Helmet>
      <Wrap>
        <Code>404</Code>
        <Msg>bash: page: command not found</Msg>
        <Cmd>$ ls /pages</Cmd>
        <p>accueil  projets  writeups  a-propos  contact</p>
        <br />
        <Cmd>$ cd ~</Cmd>
        <Back to="/">→ retour à l'accueil</Back>
      </Wrap>
    </>
  )
}
