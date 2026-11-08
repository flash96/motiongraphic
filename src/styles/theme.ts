export const theme = {
  colors: {
    brandGold: '#F0A500',
    brandGoldDark: '#C78800',
    brandGray: '#4A4A4A',
    persibBlue: '#003DA5',
    persibLightBlue: '#0070C0',
    surfaceDark: '#0A0A0A',
    surfaceCard: '#141414',
    surfaceCardLight: '#1E1E1E',
    textPrimary: '#FFFFFF',
    textMuted: '#9A9A9A',
    win: '#43A047',
    loss: '#E53935',
    draw: '#9A9A9A',
  },
  fonts: {
    display: 'Bebas Neue',
    body: 'Inter',
  },
  canvas: {
    width: 1080,
    height: 1920,
  },
  fps: 30,
  duration: {
    intro: 3,
    score: 5,
    stats: 8,
    motm: 6,
    standings: 4,
    outro: 4,
  },
} as const;

export type Theme = typeof theme;

