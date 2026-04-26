export const theme = {
  colors: {
    bg: '#030915',
    bgSoft: '#0A1322',
    panel: 'rgba(19, 38, 59, 0.9)',
    panelMuted: 'rgba(22, 35, 52, 0.85)',
    accent: '#229DFF',
    accentSoft: '#1A79CC',
    border: '#8BD9FF',
    glow: '#57C7FF',
    text: '#F1FAFF',
    muted: '#A9BDD0',
    success: '#8DEFC0',
    warning: '#F6C96C',
    locked: '#738196',
    chip: '#19314B',
    disabled: '#2B313D'
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    pill: 999
  },
  type: {
    title: 32,
    section: 22,
    body: 16,
    small: 13
  }
} as const;
