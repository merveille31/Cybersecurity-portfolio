import { useEffect, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import { openAssistant } from '../../lib/assistant'
import { isOn, visibleLinks } from '../../lib/modules'
import { SocialLinks, CvButtons } from '../ProfileLinks'
import type { Profile } from '../../types/database'

// ------------------------------------------------------------
// Fond : grille fine + deux halos qui dérivent lentement
// ------------------------------------------------------------
const drift = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(40px, -30px) scale(1.12); }
  100% { transform: translate(0, 0) scale(1); }
`

const Backdrop = styled.div`
  position: absolute;
  inset: -2rem calc(50% - 50vw) 0; /* pleine largeur ; html coupe le débordement */
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, black 55%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black 55%, transparent);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 44px 44px,
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 44px 44px;
    mask-image: radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%);
  }

  span {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: ${drift} 14s ease-in-out infinite;
  }
  .g { width: 420px; height: 420px; left: 42%; top: -60px; background: rgba(34, 229, 138, 0.22); }
  .b { width: 460px; height: 460px; left: 62%; top: 120px; background: rgba(61, 139, 255, 0.22); animation-delay: -7s; }

  @media (prefers-reduced-motion: reduce) { span { animation: none; } }
`

const Wrap = styled.section`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 4rem;
  align-items: center;
  padding: 3.5rem 0 4.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
    padding: 1.5rem 0 3rem;
  }
`

const Text = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    order: 2;
  }
`

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.85rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid rgba(34, 229, 138, 0.3);
  background: ${({ theme }) => theme.colors.greenDim};
  font-size: 0.8rem;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.green};
    box-shadow: 0 0 0 4px rgba(34, 229, 138, 0.2);
  }
`

const Title = styled.h1`
  font-size: clamp(2rem, 4.6vw, 3.25rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text};

  .hello {
    display: block;
    font-size: 0.55em;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: ${({ theme }) => theme.colors.muted};
    margin-bottom: 0.35rem;
  }
`

const Role = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: ${({ theme }) => theme.colors.muted};
  min-height: 1.6em;

  .prompt { color: ${({ theme }) => theme.colors.green}; }
  .word { color: ${({ theme }) => theme.colors.text}; }
  .caret {
    display: inline-block;
    width: 0.55em;
    height: 1.05em;
    margin-left: 2px;
    vertical-align: text-bottom;
    background: ${({ theme }) => theme.colors.blue};
    animation: ${keyframes`50% { opacity: 0; }`} 1s step-end infinite;
  }
`

const Bio = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 56ch;

  p + p { margin-top: 0.7rem; }
  strong { color: ${({ theme }) => theme.colors.text}; }
  a { color: ${({ theme }) => theme.colors.blue}; text-decoration: underline; text-underline-offset: 3px; }
`

const Buttons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`

export const PrimaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.4rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.green};
  color: ${({ theme }) => theme.colors.onAccent};
  font-weight: 600;
  font-size: 0.95rem;
  transition: background 0.15s, box-shadow 0.2s, transform 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.greenHover};
    box-shadow: ${({ theme }) => theme.shadow.glowGreen};
    transform: translateY(-2px);
  }
`

export const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.3rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.blue}; background: ${({ theme }) => theme.colors.blueDim}; }
`

export const SparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
  </svg>
)

// ------------------------------------------------------------
// Portrait : carte inclinable au survol + badges flottants
// ------------------------------------------------------------
const Stage = styled.div`
  position: relative;
  justify-self: center;
  width: min(100%, 360px);
  aspect-ratio: 4 / 5;
  perspective: 1000px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    order: 1;
    width: min(58%, 230px);
  }
`

const PortraitCard = styled(motion.div)`
  position: absolute;
  inset: 0;
  border-radius: 32px;
  padding: 3px;
  background: ${({ theme }) => theme.colors.gradient};
  box-shadow: 0 40px 90px -30px rgba(34, 229, 138, 0.45), 0 30px 80px -40px rgba(61, 139, 255, 0.6);
  transform-style: preserve-3d;
`

const PortraitInner = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 29px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 20%, rgba(34, 229, 138, 0.25), transparent 55%),
    radial-gradient(circle at 80% 90%, rgba(61, 139, 255, 0.3), transparent 55%),
    ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};

  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
`

const Badge = styled(motion.div)<{ $pos: string; $delay: number }>`
  position: absolute;
  ${({ $pos }) => $pos}
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.85rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: rgba(11, 19, 26, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: ${({ theme }) => theme.shadow.card};
  animation: ${float} 5s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;

  i { font-style: normal; color: ${({ theme }) => theme.colors.green}; }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`

function Portrait({ profile, badges }: { profile: Profile | null; badges: string[] }) {
  const reduced = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 15 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 15 })

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { mx.set(0); my.set(0) }

  const name = profile?.full_name || 'Carelle'
  const positions = ['top: 8%; left: -12%;', 'top: 46%; right: -14%;', 'bottom: 6%; left: -6%;']

  return (
    <Stage onMouseMove={onMove} onMouseLeave={onLeave}>
      <PortraitCard
        style={{ rotateX, rotateY }}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <PortraitInner>
          {profile?.avatar_url && !failed
            ? <img src={profile.avatar_url} alt={`Photo de ${name}`} onError={() => setFailed(true)} />
            : <span aria-hidden="true">{name.charAt(0)}</span>}
        </PortraitInner>
      </PortraitCard>
      {badges.slice(0, 3).map((label, i) => (
        <Badge
          key={label}
          $pos={positions[i]}
          $delay={i * 1.3}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
        >
          <i aria-hidden="true">●</i>{label}
        </Badge>
      ))}
    </Stage>
  )
}

// ------------------------------------------------------------
// Rôles qui s'écrivent et s'effacent en boucle
// ------------------------------------------------------------
function useTypewriter(words: string[]) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const word = words[index % words.length] ?? ''

  useEffect(() => {
    if (reduced || words.length === 0) return
    const done = !deleting && length === word.length
    const empty = deleting && length === 0
    const delay = done ? 1600 : empty ? 300 : deleting ? 35 : 70
    const id = setTimeout(() => {
      if (done) setDeleting(true)
      else if (empty) { setDeleting(false); setIndex(i => i + 1) }
      else setLength(l => l + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(id)
  }, [length, deleting, word, reduced, words.length])

  return reduced ? word : word.slice(0, length)
}

// ------------------------------------------------------------
// Héros
// ------------------------------------------------------------
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

const FALLBACK_ROLES = ['sécurité offensive', 'sécurité défensive', 'CTF', 'analyse réseau']

export default function Hero({ profile, badges }: { profile: Profile | null; badges: string[] }) {
  const name = profile?.full_name || 'Carelle'
  const roles = Object.values(profile?.skills ?? {})
    .map(list => list?.[0])
    .filter((v): v is string => Boolean(v))
  const typed = useTypewriter(roles.length >= 2 ? roles : FALLBACK_ROLES)
  const showCv = isOn(profile, 'cv')

  return (
    <Wrap>
      <Backdrop aria-hidden="true"><span className="g" /><span className="b" /></Backdrop>

      <Text initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
        <motion.div variants={item}>
          <Status>{profile?.location ? `Cybersécurité · ${profile.location}` : 'Cybersécurité · offensive & défensive'}</Status>
        </motion.div>
        <motion.div variants={item}>
          <Title><span className="hello">Bonjour, je suis</span>{name}</Title>
        </motion.div>
        <motion.div variants={item}>
          <Role aria-label={profile?.headline || undefined}>
            <span className="prompt">$ </span>
            <span aria-hidden="true">focus --on </span>
            <span className="word" aria-hidden="true">{typed}</span>
            <span className="caret" aria-hidden="true" />
          </Role>
        </motion.div>
        <motion.div variants={item}>
          <Bio>
            {profile?.bio
              ? <ReactMarkdown>{profile.bio}</ReactMarkdown>
              : <p>{profile?.headline || 'Étudiante en cybersécurité, je casse des systèmes pour apprendre à mieux les protéger.'}</p>}
          </Bio>
        </motion.div>
        <motion.div variants={item}>
          <Buttons>
            {showCv && profile?.cv_url
              ? <CvButtons url={profile.cv_url} />
              : <PrimaryBtn to="/projets">Voir mes projets</PrimaryBtn>}
            {isOn(profile, 'assistant') && (
              <GhostBtn type="button" onClick={() => openAssistant()}>
                <SparkIcon /> Poser une question
              </GhostBtn>
            )}
          </Buttons>
        </motion.div>
        {profile && (
          <motion.div variants={item}>
            <SocialLinks links={visibleLinks(profile)} />
          </motion.div>
        )}
      </Text>

      <Portrait profile={profile} badges={badges} />
    </Wrap>
  )
}
