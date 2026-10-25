import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.sans};
    font-size: 16px;
    line-height: 1.65;
    background:
      radial-gradient(900px 520px at 8% -10%, rgba(34,229,138,0.10), transparent 60%),
      radial-gradient(800px 520px at 100% 0%, rgba(61,139,255,0.10), transparent 60%),
      ${({ theme }) => theme.colors.bg};
    background-attachment: fixed;
    color: ${({ theme }) => theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  a {
    color: ${({ theme }) => theme.colors.blue};
    text-decoration: none;
    transition: color 0.15s;
    &:hover { color: ${({ theme }) => theme.colors.blueHover}; }
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.blue};
    outline-offset: 3px;
    border-radius: 3px;
  }

  code, pre, kbd {
    font-family: ${({ theme }) => theme.fonts.mono};
  }

  ::selection {
    background: rgba(34,229,138,0.28);
    color: ${({ theme }) => theme.colors.text};
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${({ theme }) => theme.colors.bg}; }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`

export default GlobalStyle
