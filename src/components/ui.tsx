import styled, { keyframes } from 'styled-components'

// ------------------------------------------------------------
// Skeleton
// ------------------------------------------------------------
const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`

export const Skeleton = styled.div<{ $h?: string; $w?: string; $radius?: string }>`
  height: ${({ $h }) => $h ?? '1rem'};
  width: ${({ $w }) => $w ?? '100%'};
  border-radius: ${({ $radius }) => $radius ?? '6px'};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surface} 25%,
    ${({ theme }) => theme.colors.border} 50%,
    ${({ theme }) => theme.colors.surface} 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s infinite linear;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${({ theme }) => theme.colors.surface};
  }
`

// ------------------------------------------------------------
// Badge difficulté — couleurs sémantiques du thème
// facile → vert, moyen → jaune, difficile → orange, insane → rouge
// ------------------------------------------------------------
const DIFFICULTY_COLORS: Record<string, string> = {
  facile:    '#22E58A',
  moyen:     '#FFC542',
  difficile: '#FF8A3D',
  insane:    '#FF5470',
}

export const Badge = styled.span<{ $value: string }>`
  display: inline-block;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: #03120B;
  background: ${({ $value }) => DIFFICULTY_COLORS[$value] ?? '#8DA2AF'};
`

export const CategoryBadge = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.blue};
  background: ${({ theme }) => theme.colors.blueDim};
  border: 1px solid ${({ theme }) => theme.colors.blue}44;
`

export const Tag = styled.span`
  display: inline-block;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.muted};
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${({ theme }) => theme.colors.border};
`

// ------------------------------------------------------------
// EmptyState
// ------------------------------------------------------------
const EmptyWrap = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  line-height: 1.8;
`

export function EmptyState({ message }: { message: string }) {
  return (
    <EmptyWrap>
      <div>$ ls</div>
      <div>{message}</div>
    </EmptyWrap>
  )
}

// ------------------------------------------------------------
// ErrorMessage
// ------------------------------------------------------------
const ErrWrap = styled.div`
  padding: 1rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.danger}55;
  background: ${({ theme }) => theme.colors.danger}0f;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
`

export function ErrorMessage({ message }: { message: string }) {
  return <ErrWrap>⚠ {message}</ErrWrap>
}
