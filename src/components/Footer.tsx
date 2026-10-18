import styled from 'styled-components'

const Bar = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1rem 1.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
`

export default function Footer() {
  return (
    <Bar>
      <span>carelle@portfolio:~$ </span>
      <span>© {new Date().getFullYear()} — tous droits réservés</span>
    </Bar>
  )
}
