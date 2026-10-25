// Palette « noir / vert / bleu » : un noir légèrement bleuté pour la profondeur,
// un vert vif (couleur d'action) et un bleu électrique (liens, accents secondaires).
export const theme = {
  colors: {
    bg:           '#05090D',
    surface:      '#0B131A',
    surfaceHover: '#101C26',
    border:       '#192734',
    borderStrong: '#263B4C',

    text:  '#EAF5F1',
    muted: '#8DA2AF',

    // Couleur d'action : boutons, onglet actif, curseur du terminal
    green:        '#22E58A',
    greenHover:   '#4FF0A6',
    greenPressed: '#12C472',
    greenDim:     'rgba(34,229,138,0.12)',

    // Accent secondaire : liens, survols, badges de catégorie
    blue:        '#3D8BFF',
    blueHover:   '#6AA7FF',
    bluePressed: '#2470E6',
    blueDim:     'rgba(61,139,255,0.14)',

    // Pont entre les deux, utilisé dans les dégradés
    cyan: '#17D0D8',

    onAccent: '#03120B', // texte posé sur un fond vert

    success: '#22E58A',
    warning: '#FFC542',
    danger:  '#FF5470',

    gradient:     'linear-gradient(120deg, #22E58A 0%, #17D0D8 50%, #3D8BFF 100%)',
    gradientSoft: 'linear-gradient(120deg, rgba(34,229,138,0.16), rgba(61,139,255,0.16))',
  },
  fonts: {
    heading: "'Space Grotesk', system-ui, sans-serif",
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
  shadow: {
    glowGreen: '0 0 0 1px rgba(34,229,138,0.35), 0 12px 40px -12px rgba(34,229,138,0.45)',
    glowBlue:  '0 0 0 1px rgba(61,139,255,0.35), 0 12px 40px -12px rgba(61,139,255,0.45)',
    card:      '0 18px 50px -24px rgba(0,0,0,0.8)',
  },
  breakpoints: {
    md: '768px',
    lg: '1100px',
  },
} as const

export type Theme = typeof theme
