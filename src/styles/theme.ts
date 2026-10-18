export const theme = {
  colors: {
    bg: '#0d0e14',
    surface: '#13141c',
    border: '#1e2030',
    text: '#a9b1d6',
    textHeading: '#c0caf5',
    accent: '#7aa2f7',
    accentDim: 'rgba(122,162,247,0.15)',
    green: '#9ece6a',
    red: '#f7768e',
    yellow: '#e0af68',
    muted: '#565f89',
  },
  fonts: {
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  breakpoints: {
    md: '768px',
  },
} as const

export type Theme = typeof theme
