import styled from 'styled-components'

const Bar = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1.25rem 1.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`

const Dollar = styled.span`
  color: ${({ theme }) => theme.colors.magenta};
`

export default function Footer() {
  return (
    <Bar>
      <span>carelle@portfolio:~</span>
      <Dollar>$</Dollar>
      <span>© {new Date().getFullYear()}</span>
    </Bar>
  )
}
