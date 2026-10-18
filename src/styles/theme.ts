export const theme = {
  colors: {
    bg:      '#140A1E',
    surface: '#1F1230',
    border:  '#2E1C45',

    text:  '#F5EDF8',
    muted: '#B8A6C9',

    magenta:        '#FF4FA3',
    magentaHover:   '#FF73B8',
    magentaPressed: '#E0357F',
    magentaDim:     'rgba(255,79,163,0.12)',

    mandarine:        '#FF9F45',
    mandarineHover:   '#FFB46A',
    mandarinePressed: '#E07E20',
    mandarineDim:    'rgba(255,159,69,0.12)',

    violet:        '#8B5CF6',
    violetHover:   '#A78BFA',
    violetPressed: '#6D28D9',
    violetDim:     'rgba(139,92,246,0.15)',

    success: '#3DDC97',
    warning: '#FFC857',
    danger:  '#FF6B6B',

    gradientTerminal: 'linear-gradient(135deg, #FF4FA3, #FF9F45)',
  },
  fonts: {
    heading: "'Unbounded', system-ui, sans-serif",
    sans:    "'DM Sans', system-ui, sans-serif",
    mono:    "'JetBrains Mono', ui-monospace, monospace",
  },
  radius: {
    sm:   '6px',
    md:   '10px',
    lg:   '16px',
    xl:   '24px',
    full: '9999px',
  },
  breakpoints: {
    md: '768px',
    lg: '1100px',
  },
} as const

export type Theme = typeof theme
