import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { signIn } from '../../lib/auth'
import { Card, Field, Input, Button, Notice, Muted, type NoticeState } from '../../components/admin/form'

const Wrap = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 3rem auto;
`

const Prompt = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.green};
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setNotice(null)
    const error = await signIn(email.trim(), password)
    // En cas de succès, useSession() bascule automatiquement vers l'admin
    if (error) {
      setNotice({ kind: 'error', text: error })
      setPending(false)
    }
  }

  return (
    <Wrap>
      <Card as="form" onSubmit={onSubmit}>
        <div>
          <Prompt>$ sudo login</Prompt>
          <h1 style={{ fontSize: '1.4rem', marginTop: '0.25rem' }}>Administration</h1>
        </div>
        <Field label="E-mail">
          {id => (
            <Input
              id={id}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label="Mot de passe">
          {id => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Notice notice={notice} />
        <Button type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </Button>
        <Muted>Accès réservé. Les comptes sont créés depuis Supabase.</Muted>
      </Card>
    </Wrap>
  )
}
