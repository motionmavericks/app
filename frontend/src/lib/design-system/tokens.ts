/**
 * MAM Design System - Design Tokens
 * Professional Media Asset Management design foundation
 */

// Color Tokens
export const colors = {
  // Brand Colors
  brand: {
    primary: 'oklch(0.205 0 0)', // Deep charcoal for professionalism
    secondary: 'oklch(0.488 0.243 264.376)', // Professional blue accent
    accent: 'oklch(0.646 0.222 41.116)', // Warm accent for interactions
  },

  // Semantic Colors
  semantic: {
    success: 'oklch(0.769 0.188 70.08)',
    warning: 'oklch(0.828 0.189 84.429)',
    error: 'oklch(0.577 0.245 27.325)',
    info: 'oklch(0.6 0.118 184.704)',
  },

  // Status Colors (for asset workflow)
  status: {
    draft: 'oklch(0.708 0 0)', // Neutral gray
    review: 'oklch(0.828 0.189 84.429)', // Warning orange
    approved: 'oklch(0.769 0.188 70.08)', // Success green
    published: 'oklch(0.488 0.243 264.376)', // Primary blue
    archived: 'oklch(0.556 0 0)', // Muted gray
  },

  // Media Type Colors
  mediaTypes: {
    video: 'oklch(0.627 0.265 303.9)', // Purple for video
    image: 'oklch(0.646 0.222 41.116)', // Orange for images
    audio: 'oklch(0.769 0.188 70.08)', // Green for audio
    document: 'oklch(0.6 0.118 184.704)', // Blue for documents
    other: 'oklch(0.708 0 0)', // Gray for others
  },

  // Neutral Scale (Light Mode)
  neutral: {
    50: 'oklch(0.985 0 0)',
    100: 'oklch(0.97 0 0)',
    200: 'oklch(0.922 0 0)',
    300: 'oklch(0.856 0 0)',
    400: 'oklch(0.708 0 0)',
    500: 'oklch(0.556 0 0)',
    600: 'oklch(0.434 0 0)',
    700: 'oklch(0.312 0 0)',
    800: 'oklch(0.205 0 0)',
    900: 'oklch(0.145 0 0)',
  },

  // Dark Mode Neutrals
  dark: {
    50: 'oklch(0.145 0 0)',
    100: 'oklch(0.205 0 0)',
    200: 'oklch(0.269 0 0)',
    300: 'oklch(0.334 0 0)',
    400: 'oklch(0.434 0 0)',
    500: 'oklch(0.556 0 0)',
    600: 'oklch(0.708 0 0)',
    700: 'oklch(0.856 0 0)',
    800: 'oklch(0.922 0 0)',
    900: 'oklch(0.985 0 0)',
  },
} as const;

// Typography Tokens
export const typography = {
  // Font Families
  fontFamily: {
    sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
    mono: ['var(--font-geist-mono)', 'ui-monospace', 'SF Mono'],
    display: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
  },

  // Font Sizes (rem based for accessibility)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing Tokens (8px grid system)
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  18: '4.5rem', // 72px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

// Border Radius Tokens
export const borderRadius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)', // ~6px
  md: 'calc(var(--radius) - 2px)', // ~8px
  lg: 'var(--radius)', // 10px (default)
  xl: 'calc(var(--radius) + 4px)', // ~14px
  '2xl': 'calc(var(--radius) + 8px)', // ~18px
  '3xl': 'calc(var(--radius) + 12px)', // ~22px
  full: '9999px',
} as const;

// Shadow Tokens
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// Z-Index Tokens
export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  // Semantic z-index values
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Animation Tokens
export const animation = {
  // Duration
  duration: {
    fastest: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    slowest: '800ms',
  },

  // Easing
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Custom easings for professional feel
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  // MAM specific breakpoints
  'asset-grid-sm': '480px', // 2 columns
  'asset-grid-md': '768px', // 3 columns
  'asset-grid-lg': '1024px', // 4 columns
  'asset-grid-xl': '1280px', // 5 columns
  'asset-grid-2xl': '1536px', // 6 columns
} as const;

// Component-specific tokens
export const components = {
  // Asset Card
  assetCard: {
    width: {
      sm: '200px',
      md: '240px',
      lg: '280px',
    },
    aspectRatio: '16 / 9',
    thumbnailRadius: borderRadius.lg,
  },

  // Asset Grid
  assetGrid: {
    gap: spacing[4],
    padding: spacing[6],
  },

  // Sidebar
  sidebar: {
    width: '18rem', // 288px
    collapsedWidth: '4rem', // 64px
  },

  // Topbar
  topbar: {
    height: '3.5rem', // 56px
  },

  // Asset Browser
  assetBrowser: {
    virtualItemHeight: {
      grid: 280,
      list: 80,
    },
    gridColumns: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 5,
    },
  },
} as const;

// Export default design tokens
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  animation,
  breakpoints,
  components,
} as const;

export type DesignTokens = typeof designTokens;