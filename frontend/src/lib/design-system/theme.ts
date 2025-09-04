/**
 * MAM Design System - Theme Configuration
 * Centralized theme management for professional MAM interface
 */

import { designTokens } from './tokens';

// Theme variant type
export type ThemeMode = 'light' | 'dark';

// Base theme structure
interface Theme {
  colors: {
    // Background colors
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      elevated: string;
      overlay: string;
    };

    // Text colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      accent: string;
      muted: string;
    };

    // Border colors
    border: {
      primary: string;
      secondary: string;
      focus: string;
      hover: string;
      divider: string;
    };

    // Interactive colors
    interactive: {
      primary: string;
      primaryHover: string;
      primaryPressed: string;
      secondary: string;
      secondaryHover: string;
      secondaryPressed: string;
      accent: string;
      accentHover: string;
      accentPressed: string;
    };

    // Status colors
    status: {
      draft: string;
      review: string;
      approved: string;
      published: string;
      archived: string;
    };

    // Media type colors
    mediaTypes: {
      video: string;
      image: string;
      audio: string;
      document: string;
      other: string;
    };

    // Semantic colors
    semantic: {
      success: string;
      successBackground: string;
      warning: string;
      warningBackground: string;
      error: string;
      errorBackground: string;
      info: string;
      infoBackground: string;
    };
  };

  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    focus: string;
  };

  // Component-specific theming
  components: {
    assetCard: {
      background: string;
      backgroundHover: string;
      border: string;
      borderHover: string;
      shadow: string;
      shadowHover: string;
    };

    sidebar: {
      background: string;
      border: string;
      itemBackground: string;
      itemBackgroundHover: string;
      itemBackgroundActive: string;
      itemText: string;
      itemTextActive: string;
    };

    topbar: {
      background: string;
      border: string;
      searchBackground: string;
      breadcrumbText: string;
      breadcrumbActiveText: string;
    };

    dropdown: {
      background: string;
      border: string;
      shadow: string;
      itemBackground: string;
      itemBackgroundHover: string;
      itemText: string;
    };

    modal: {
      background: string;
      overlay: string;
      border: string;
      shadow: string;
    };

    button: {
      primary: {
        background: string;
        backgroundHover: string;
        backgroundPressed: string;
        text: string;
        border: string;
      };
      secondary: {
        background: string;
        backgroundHover: string;
        backgroundPressed: string;
        text: string;
        border: string;
      };
      ghost: {
        background: string;
        backgroundHover: string;
        backgroundPressed: string;
        text: string;
        border: string;
      };
    };

    input: {
      background: string;
      backgroundFocus: string;
      border: string;
      borderFocus: string;
      text: string;
      placeholder: string;
      shadow: string;
      shadowFocus: string;
    };
  };
}

// Light theme configuration
export const lightTheme: Theme = {
  colors: {
    background: {
      primary: designTokens.colors.neutral[50], // White/near-white
      secondary: designTokens.colors.neutral[100], // Light gray
      tertiary: designTokens.colors.neutral[200], // Lighter gray
      inverse: designTokens.colors.neutral[900], // Dark
      elevated: '#ffffff', // Pure white for cards
      overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
    },

    text: {
      primary: designTokens.colors.neutral[900], // Dark text
      secondary: designTokens.colors.neutral[700], // Medium text
      tertiary: designTokens.colors.neutral[500], // Light text
      inverse: designTokens.colors.neutral[50], // Light text on dark
      accent: designTokens.colors.brand.secondary, // Brand accent
      muted: designTokens.colors.neutral[400], // Muted text
    },

    border: {
      primary: designTokens.colors.neutral[200], // Subtle borders
      secondary: designTokens.colors.neutral[300], // More prominent borders
      focus: designTokens.colors.brand.secondary, // Focus states
      hover: designTokens.colors.neutral[400], // Hover states
      divider: designTokens.colors.neutral[200], // Section dividers
    },

    interactive: {
      primary: designTokens.colors.brand.primary,
      primaryHover: 'oklch(0.25 0 0)', // Slightly lighter
      primaryPressed: 'oklch(0.15 0 0)', // Darker
      secondary: designTokens.colors.neutral[100],
      secondaryHover: designTokens.colors.neutral[200],
      secondaryPressed: designTokens.colors.neutral[300],
      accent: designTokens.colors.brand.accent,
      accentHover: 'oklch(0.7 0.25 41.116)',
      accentPressed: 'oklch(0.6 0.2 41.116)',
    },

    status: designTokens.colors.status,
    mediaTypes: designTokens.colors.mediaTypes,

    semantic: {
      success: designTokens.colors.semantic.success,
      successBackground: 'oklch(0.95 0.1 70.08)',
      warning: designTokens.colors.semantic.warning,
      warningBackground: 'oklch(0.95 0.1 84.429)',
      error: designTokens.colors.semantic.error,
      errorBackground: 'oklch(0.95 0.1 27.325)',
      info: designTokens.colors.semantic.info,
      infoBackground: 'oklch(0.95 0.1 184.704)',
    },
  },

  shadows: {
    sm: designTokens.shadows.sm,
    md: designTokens.shadows.md,
    lg: designTokens.shadows.lg,
    xl: designTokens.shadows.xl,
    focus: '0 0 0 3px rgb(79 70 229 / 0.1)', // Focus ring
  },

  components: {
    assetCard: {
      background: '#ffffff',
      backgroundHover: designTokens.colors.neutral[50],
      border: designTokens.colors.neutral[200],
      borderHover: designTokens.colors.neutral[300],
      shadow: designTokens.shadows.sm,
      shadowHover: designTokens.shadows.md,
    },

    sidebar: {
      background: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
      border: designTokens.colors.neutral[200],
      itemBackground: 'transparent',
      itemBackgroundHover: designTokens.colors.neutral[100],
      itemBackgroundActive: designTokens.colors.brand.secondary,
      itemText: designTokens.colors.neutral[700],
      itemTextActive: '#ffffff',
    },

    topbar: {
      background: 'rgba(255, 255, 255, 0.9)', // Semi-transparent
      border: designTokens.colors.neutral[200],
      searchBackground: designTokens.colors.neutral[100],
      breadcrumbText: designTokens.colors.neutral[600],
      breadcrumbActiveText: designTokens.colors.neutral[900],
    },

    dropdown: {
      background: '#ffffff',
      border: designTokens.colors.neutral[200],
      shadow: designTokens.shadows.lg,
      itemBackground: 'transparent',
      itemBackgroundHover: designTokens.colors.neutral[100],
      itemText: designTokens.colors.neutral[700],
    },

    modal: {
      background: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
      border: designTokens.colors.neutral[200],
      shadow: designTokens.shadows['2xl'],
    },

    button: {
      primary: {
        background: designTokens.colors.brand.primary,
        backgroundHover: 'oklch(0.25 0 0)',
        backgroundPressed: 'oklch(0.15 0 0)',
        text: '#ffffff',
        border: designTokens.colors.brand.primary,
      },
      secondary: {
        background: designTokens.colors.neutral[100],
        backgroundHover: designTokens.colors.neutral[200],
        backgroundPressed: designTokens.colors.neutral[300],
        text: designTokens.colors.neutral[700],
        border: designTokens.colors.neutral[200],
      },
      ghost: {
        background: 'transparent',
        backgroundHover: designTokens.colors.neutral[100],
        backgroundPressed: designTokens.colors.neutral[200],
        text: designTokens.colors.neutral[600],
        border: 'transparent',
      },
    },

    input: {
      background: '#ffffff',
      backgroundFocus: '#ffffff',
      border: designTokens.colors.neutral[200],
      borderFocus: designTokens.colors.brand.secondary,
      text: designTokens.colors.neutral[900],
      placeholder: designTokens.colors.neutral[400],
      shadow: designTokens.shadows.sm,
      shadowFocus: '0 0 0 3px rgb(79 70 229 / 0.1)',
    },
  },
};

// Dark theme configuration
export const darkTheme: Theme = {
  colors: {
    background: {
      primary: designTokens.colors.dark[50], // Very dark
      secondary: designTokens.colors.dark[100], // Dark
      tertiary: designTokens.colors.dark[200], // Medium dark
      inverse: designTokens.colors.dark[900], // Light
      elevated: designTokens.colors.dark[100], // Elevated surfaces
      overlay: 'rgba(0, 0, 0, 0.7)', // Modal overlay
    },

    text: {
      primary: designTokens.colors.dark[900], // Light text
      secondary: designTokens.colors.dark[700], // Medium light text
      tertiary: designTokens.colors.dark[500], // Dimmed text
      inverse: designTokens.colors.dark[50], // Dark text on light
      accent: designTokens.colors.brand.secondary, // Brand accent
      muted: designTokens.colors.dark[400], // Muted text
    },

    border: {
      primary: 'oklch(1 0 0 / 10%)', // Very subtle
      secondary: 'oklch(1 0 0 / 15%)', // Slightly more visible
      focus: designTokens.colors.brand.secondary, // Focus states
      hover: 'oklch(1 0 0 / 20%)', // Hover states
      divider: 'oklch(1 0 0 / 10%)', // Section dividers
    },

    interactive: {
      primary: 'oklch(0.922 0 0)', // Light for dark theme
      primaryHover: 'oklch(0.8 0 0)',
      primaryPressed: 'oklch(0.7 0 0)',
      secondary: designTokens.colors.dark[200],
      secondaryHover: designTokens.colors.dark[300],
      secondaryPressed: designTokens.colors.dark[400],
      accent: designTokens.colors.brand.accent,
      accentHover: 'oklch(0.7 0.25 41.116)',
      accentPressed: 'oklch(0.6 0.2 41.116)',
    },

    // Use same status and media type colors as light theme for consistency
    status: designTokens.colors.status,
    mediaTypes: designTokens.colors.mediaTypes,

    semantic: {
      success: designTokens.colors.semantic.success,
      successBackground: 'oklch(0.15 0.1 70.08)',
      warning: designTokens.colors.semantic.warning,
      warningBackground: 'oklch(0.15 0.1 84.429)',
      error: designTokens.colors.semantic.error,
      errorBackground: 'oklch(0.15 0.1 27.325)',
      info: designTokens.colors.semantic.info,
      infoBackground: 'oklch(0.15 0.1 184.704)',
    },
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    focus: '0 0 0 3px rgb(79 70 229 / 0.3)', // Focus ring
  },

  components: {
    assetCard: {
      background: designTokens.colors.dark[100],
      backgroundHover: designTokens.colors.dark[200],
      border: 'oklch(1 0 0 / 10%)',
      borderHover: 'oklch(1 0 0 / 20%)',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      shadowHover: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
    },

    sidebar: {
      background: 'rgba(32, 32, 32, 0.9)', // Semi-transparent dark
      border: 'oklch(1 0 0 / 10%)',
      itemBackground: 'transparent',
      itemBackgroundHover: designTokens.colors.dark[200],
      itemBackgroundActive: designTokens.colors.brand.secondary,
      itemText: designTokens.colors.dark[700],
      itemTextActive: '#ffffff',
    },

    topbar: {
      background: 'rgba(32, 32, 32, 0.95)', // Semi-transparent
      border: 'oklch(1 0 0 / 10%)',
      searchBackground: 'oklch(1 0 0 / 15%)',
      breadcrumbText: designTokens.colors.dark[600],
      breadcrumbActiveText: designTokens.colors.dark[900],
    },

    dropdown: {
      background: designTokens.colors.dark[100],
      border: 'oklch(1 0 0 / 15%)',
      shadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
      itemBackground: 'transparent',
      itemBackgroundHover: designTokens.colors.dark[200],
      itemText: designTokens.colors.dark[700],
    },

    modal: {
      background: designTokens.colors.dark[100],
      overlay: 'rgba(0, 0, 0, 0.7)',
      border: 'oklch(1 0 0 / 15%)',
      shadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    },

    button: {
      primary: {
        background: 'oklch(0.922 0 0)',
        backgroundHover: 'oklch(0.8 0 0)',
        backgroundPressed: 'oklch(0.7 0 0)',
        text: designTokens.colors.dark[50],
        border: 'oklch(0.922 0 0)',
      },
      secondary: {
        background: designTokens.colors.dark[200],
        backgroundHover: designTokens.colors.dark[300],
        backgroundPressed: designTokens.colors.dark[400],
        text: designTokens.colors.dark[700],
        border: 'oklch(1 0 0 / 15%)',
      },
      ghost: {
        background: 'transparent',
        backgroundHover: designTokens.colors.dark[200],
        backgroundPressed: designTokens.colors.dark[300],
        text: designTokens.colors.dark[600],
        border: 'transparent',
      },
    },

    input: {
      background: 'oklch(1 0 0 / 15%)',
      backgroundFocus: 'oklch(1 0 0 / 15%)',
      border: 'oklch(1 0 0 / 10%)',
      borderFocus: designTokens.colors.brand.secondary,
      text: designTokens.colors.dark[900],
      placeholder: designTokens.colors.dark[400],
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      shadowFocus: '0 0 0 3px rgb(79 70 229 / 0.3)',
    },
  },
};

// Theme context and utilities
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

// Helper function to get current theme
export const getCurrentTheme = (mode: ThemeMode): Theme => {
  return themes[mode];
};

// CSS custom properties generator
export const generateCSSVariables = (theme: Theme) => {
  const vars: Record<string, string> = {};

  // Background variables
  vars['--bg-primary'] = theme.colors.background.primary;
  vars['--bg-secondary'] = theme.colors.background.secondary;
  vars['--bg-tertiary'] = theme.colors.background.tertiary;
  vars['--bg-inverse'] = theme.colors.background.inverse;
  vars['--bg-elevated'] = theme.colors.background.elevated;
  vars['--bg-overlay'] = theme.colors.background.overlay;

  // Text variables
  vars['--text-primary'] = theme.colors.text.primary;
  vars['--text-secondary'] = theme.colors.text.secondary;
  vars['--text-tertiary'] = theme.colors.text.tertiary;
  vars['--text-inverse'] = theme.colors.text.inverse;
  vars['--text-accent'] = theme.colors.text.accent;
  vars['--text-muted'] = theme.colors.text.muted;

  // Border variables
  vars['--border-primary'] = theme.colors.border.primary;
  vars['--border-secondary'] = theme.colors.border.secondary;
  vars['--border-focus'] = theme.colors.border.focus;
  vars['--border-hover'] = theme.colors.border.hover;
  vars['--border-divider'] = theme.colors.border.divider;

  // Interactive variables
  vars['--interactive-primary'] = theme.colors.interactive.primary;
  vars['--interactive-primary-hover'] = theme.colors.interactive.primaryHover;
  vars['--interactive-primary-pressed'] = theme.colors.interactive.primaryPressed;

  // Shadow variables
  vars['--shadow-sm'] = theme.shadows.sm;
  vars['--shadow-md'] = theme.shadows.md;
  vars['--shadow-lg'] = theme.shadows.lg;
  vars['--shadow-xl'] = theme.shadows.xl;
  vars['--shadow-focus'] = theme.shadows.focus;

  return vars;
};

export type { Theme };