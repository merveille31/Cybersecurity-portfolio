import { useState, useCallback, useEffect, useRef, useId } from 'react'
import { Helmet } from 'react-helmet-async'
import styled from 'styled-components'
import { useQuery, fetchProfile } from '../lib/queries'
import { openAssistant } from '../lib/assistant'
import { PageHeader } from '../components/cards'
import { SocialLinks, CvButtons } from '../components/ProfileLinks'

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
const PageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 3rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`

const baseInput = `
  width: 100%;
  padding: 0.6rem 0.875rem;
  border-radius: 10px;
  border: 1px solid;
  background: #0B131A;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  transition: border-color 0.15s;
  color: #EAF5F1;

  &::placeholder { color: #8DA2AF; opacity: 0.7; }
  &:focus { outline: none; }
`

const Input = styled.input<{ $error?: boolean }>`
  ${baseInput}
  border-color: ${({ $error, theme }) => $error ? theme.colors.danger : theme.colors.border};

  &:focus {
    border-color: ${({ $error, theme }) => $error ? theme.colors.danger : theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ $error, theme }) =>
      $error ? theme.colors.danger + '22' : theme.colors.blueDim};
  }
`

const Textarea = styled.textarea<{ $error?: boolean }>`
  ${baseInput}
  resize: vertical;
  min-height: 140px;
  border-color: ${({ $error, theme }) => $error ? theme.colors.danger : theme.colors.border};

  &:focus {
    border-color: ${({ $error, theme }) => $error ? theme.colors.danger : theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ $error, theme }) =>
      $error ? theme.colors.danger + '22' : theme.colors.blueDim};
  }
`

const FieldError = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.danger};
  margin: 0;
`

const CharCount = styled.p<{ $warn: boolean }>`
  font-size: 0.75rem;
  color: ${({ $warn, theme }) => $warn ? theme.colors.warning : theme.colors.muted};
  text-align: right;
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
`

// Champ piège — invisible pour les humains et les lecteurs d'écran
const Honeypot = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

const SubmitBtn = styled.button<{ $loading?: boolean }>`
  align-self: flex-start;
  padding: 0.75rem 1.9rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: none;
  background: ${({ theme }) => theme.colors.green};
  color: #03120B;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: background 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.greenHover};
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
  }
  &:active:not(:disabled) { background: ${({ theme }) => theme.colors.greenPressed}; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.blue};
    outline-offset: 3px;
  }
`

// Annonces aria-live
const LiveRegion = styled.div`
  margin-top: 0.5rem;
`

const SuccessBox = styled.div`
  padding: 1rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}44;
  background: ${({ theme }) => theme.colors.success}0f;
  color: ${({ theme }) => theme.colors.success};
  font-size: 0.9rem;
`

const ErrorBox = styled.div`
  padding: 1rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.danger}44;
  background: ${({ theme }) => theme.colors.danger}0f;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
`

const RateLimitBox = styled.div`
  padding: 1rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.warning}44;
  background: ${({ theme }) => theme.colors.warning}0f;
  color: ${({ theme }) => theme.colors.warning};
  font-size: 0.9rem;
`

// Colonne infos
const InfoCol = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.25rem;
`

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const InfoLabel = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.cyan};
  margin: 0;
`

const InfoEmail = styled.a`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.blue};
  text-decoration: underline;
  text-underline-offset: 3px;
  word-break: break-all;
  &:hover { color: ${({ theme }) => theme.colors.blueHover}; }
`

const AssistantHint = styled.button`
  text-align: left;
  padding: 0.85rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px dashed rgba(61, 139, 255, 0.5);
  background: ${({ theme }) => theme.colors.blueDim};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: ${({ theme }) => theme.colors.blue}; }
`

// ------------------------------------------------------------
// Constantes
// ------------------------------------------------------------
const BODY_MAX = 5000
const BODY_WARN = 4500

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'ratelimit'

interface FieldErrors {
  name?: string
  email?: string
  subject?: string
  body?: string
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function Contact() {
  const profileQ = useQuery(useCallback(() => fetchProfile(), []))
  const profile = profileQ.status === 'success' ? profileQ.data : null

  const [formState, setFormState] = useState<FormState>('idle')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')

  // Honeypot
  const honeypotRef = useRef<HTMLInputElement>(null)
  // Horodatage d'affichage du formulaire
  const shownAtRef = useRef<number>(0)
  useEffect(() => { shownAtRef.current = Date.now() }, [])

  const nameId    = useId()
  const emailId   = useId()
  const subjectId = useId()
  const bodyId    = useId()
  const liveId    = useId()
  // liveId est utilisé sur LiveRegion ci-dessous

  const reset = useCallback(() => {
    setName(''); setEmail(''); setSubject(''); setBody('')
    setFieldErrors({})
    shownAtRef.current = Date.now()
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setFieldErrors({})

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          body,
          website: honeypotRef.current?.value ?? '',
          shown_at: shownAtRef.current,
        }),
      })

      if (res.status === 201) {
        setFormState('success')
        reset()
        return
      }

      if (res.status === 429) {
        setFormState('ratelimit')
        return
      }

      if (res.status === 422) {
        const data = await res.json() as { errors?: FieldErrors }
        setFieldErrors(data.errors ?? {})
        setFormState('idle')
        return
      }

      setFormState('error')
    } catch {
      setFormState('error')
    }
  }, [name, email, subject, body, reset])

  const loading = formState === 'loading'

  return (
    <>
      <Helmet><title>Contact · Carelle</title></Helmet>

      <PageHeader
        eyebrow="~/contact"
        title="Me contacter"
        intro="Une offre de stage ou d'alternance, une question sur un projet ou juste envie d'échanger ? Écrivez-moi, je réponds rapidement."
      />

      <PageGrid>
        {/* Formulaire */}
        <div>
          <Form onSubmit={handleSubmit} noValidate>
            {/* Champ piège — caché pour les humains et les lecteurs d'écran */}
            <Honeypot aria-hidden="true">
              <label htmlFor="website-trap">Ne pas remplir</label>
              <input
                ref={honeypotRef}
                id="website-trap"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </Honeypot>

            <Field>
              <Label htmlFor={nameId}>Nom</Label>
              <Input
                id={nameId}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                $error={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? `${nameId}-err` : undefined}
                aria-invalid={!!fieldErrors.name}
                maxLength={100}
                required
                disabled={loading}
                autoComplete="name"
              />
              {fieldErrors.name && (
                <FieldError id={`${nameId}-err`} role="alert">{fieldErrors.name}</FieldError>
              )}
            </Field>

            <Field>
              <Label htmlFor={emailId}>E-mail</Label>
              <Input
                id={emailId}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                $error={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${emailId}-err` : undefined}
                aria-invalid={!!fieldErrors.email}
                maxLength={254}
                required
                disabled={loading}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <FieldError id={`${emailId}-err`} role="alert">{fieldErrors.email}</FieldError>
              )}
            </Field>

            <Field>
              <Label htmlFor={subjectId}>Sujet</Label>
              <Input
                id={subjectId}
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                $error={!!fieldErrors.subject}
                aria-describedby={fieldErrors.subject ? `${subjectId}-err` : undefined}
                aria-invalid={!!fieldErrors.subject}
                maxLength={200}
                required
                disabled={loading}
              />
              {fieldErrors.subject && (
                <FieldError id={`${subjectId}-err`} role="alert">{fieldErrors.subject}</FieldError>
              )}
            </Field>

            <Field>
              <Label htmlFor={bodyId}>Message</Label>
              <Textarea
                id={bodyId}
                value={body}
                onChange={e => setBody(e.target.value)}
                $error={!!fieldErrors.body}
                aria-describedby={`${bodyId}-count${fieldErrors.body ? ` ${bodyId}-err` : ''}`}
                aria-invalid={!!fieldErrors.body}
                maxLength={BODY_MAX}
                required
                disabled={loading}
              />
              <CharCount $warn={body.length >= BODY_WARN} id={`${bodyId}-count`} aria-live="polite">
                {body.length} / {BODY_MAX}
              </CharCount>
              {fieldErrors.body && (
                <FieldError id={`${bodyId}-err`} role="alert">{fieldErrors.body}</FieldError>
              )}
            </Field>

            <SubmitBtn type="submit" disabled={loading} $loading={loading} aria-busy={loading}>
              {loading ? 'Envoi en cours…' : 'Envoyer'}
            </SubmitBtn>
          </Form>

          {/* Zone d'annonces aria-live */}
          <LiveRegion id={liveId} aria-live="polite" aria-atomic="true" role="status">
            {formState === 'success' && (
              <SuccessBox role="status">
                Message envoyé. Je vous répondrai dès que possible.
              </SuccessBox>
            )}
            {formState === 'error' && (
              <ErrorBox role="alert">
                Une erreur est survenue. Veuillez réessayer dans quelques instants.
              </ErrorBox>
            )}
            {formState === 'ratelimit' && (
              <RateLimitBox role="alert">
                Vous avez envoyé trop de messages récemment. Réessayez dans une heure.
              </RateLimitBox>
            )}
          </LiveRegion>
        </div>

        {/* Colonne infos profil */}
        <InfoCol>
          {profile?.email_public && (
            <InfoBlock>
              <InfoLabel>e-mail</InfoLabel>
              <InfoEmail href={`mailto:${profile.email_public}`}>
                {profile.email_public}
              </InfoEmail>
            </InfoBlock>
          )}

          {profile && Object.values(profile.links ?? {}).some(Boolean) && (
            <InfoBlock>
              <InfoLabel>réseaux pros</InfoLabel>
              <SocialLinks links={profile.links} />
            </InfoBlock>
          )}

          {profile?.cv_url && (
            <InfoBlock>
              <InfoLabel>cv</InfoLabel>
              <CvButtons url={profile.cv_url} />
            </InfoBlock>
          )}

          <InfoBlock>
            <InfoLabel>réponse immédiate</InfoLabel>
            <AssistantHint type="button" onClick={() => openAssistant()}>
              Une question rapide sur mon parcours ? Demandez à mon assistant IA →
            </AssistantHint>
          </InfoBlock>
        </InfoCol>
      </PageGrid>
    </>
  )
}
