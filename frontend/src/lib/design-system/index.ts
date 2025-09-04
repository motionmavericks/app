/**
 * MAM Design System - Entry Point
 * Professional Media Asset Management Design System
 */

// Core design system exports
export * from './tokens';
export * from './theme';

// Component variants
export * from './components/layout';
export * from './components/button';

// Re-export existing UI components with design system integration
export * from '../utils';

// Design system utilities
import { designTokens } from './tokens';
import { lightTheme, darkTheme, getCurrentTheme, type ThemeMode, type Theme } from './theme';
import { 
  createLayoutClasses, 
  layouts,
  calculateGridColumns,
  calculateOptimalAssetCardSize 
} from './components/layout';
import { mamButtonPresets } from './components/button';

/**
 * Main Design System API
 * Provides centralized access to all design system components and utilities
 */
export const mamDesignSystem = {
  // Design tokens
  tokens: designTokens,
  
  // Themes
  themes: {
    light: lightTheme,
    dark: darkTheme,
    get: getCurrentTheme,
  },
  
  // Layout utilities
  layout: {
    classes: createLayoutClasses,
    presets: layouts,
    utils: {
      calculateGridColumns,
      calculateOptimalAssetCardSize,
    },
  },
  
  // Button presets
  buttons: mamButtonPresets,
  
  // Utility functions
  utils: {
    // Generate CSS variables from theme
    generateCSSVars: (theme: Theme) => {
      const vars: Record<string, string> = {};
      
      // Background variables
      if (theme.colors?.background) {
        Object.entries(theme.colors.background).forEach(([key, value]) => {
          vars[`--bg-${key}`] = value;
        });
      }
      
      // Text variables
      if (theme.colors?.text) {
        Object.entries(theme.colors.text).forEach(([key, value]) => {
          vars[`--text-${key}`] = value;
        });
      }
      
      // Border variables
      if (theme.colors?.border) {
        Object.entries(theme.colors.border).forEach(([key, value]) => {
          vars[`--border-${key}`] = value;
        });
      }
      
      return vars;
    },
    
    // Apply theme to document
    applyTheme: (mode: ThemeMode) => {
      if (typeof document === 'undefined') return;
      
      const theme = getCurrentTheme(mode);
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      root.classList.add(mode);
      
      // Apply CSS custom properties
      const vars = mamDesignSystem.utils.generateCSSVars(theme);
      Object.entries(vars).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
    },
    
    // Get responsive breakpoint value
    getBreakpoint: (breakpoint: keyof typeof designTokens.breakpoints) => {
      return designTokens.breakpoints[breakpoint];
    },
    
    // Check if current viewport matches breakpoint
    matchesBreakpoint: (breakpoint: keyof typeof designTokens.breakpoints) => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia(`(min-width: ${designTokens.breakpoints[breakpoint]})`).matches;
    },
  },
  
  // Constants
  constants: {
    // Asset card aspect ratios
    ASSET_ASPECT_RATIOS: {
      '16:9': 16 / 9,
      '4:3': 4 / 3,
      '1:1': 1 / 1,
      '3:4': 3 / 4,
      '9:16': 9 / 16,
    } as const,
    
    // Common asset card sizes
    ASSET_CARD_SIZES: {
      xs: { width: 160, height: 120 },
      sm: { width: 200, height: 150 },
      md: { width: 240, height: 180 },
      lg: { width: 280, height: 210 },
      xl: { width: 320, height: 240 },
    } as const,
    
    // Animation durations (ms)
    ANIMATION_DURATION: {
      fastest: 100,
      fast: 200,
      normal: 300,
      slow: 500,
      slowest: 800,
    } as const,
    
    // Z-index layers
    Z_INDEX: {
      dropdown: 1000,
      sticky: 1020,
      fixed: 1030,
      modalBackdrop: 1040,
      modal: 1050,
      popover: 1060,
      tooltip: 1070,
      toast: 1080,
    } as const,
  },
} as const;

// Default export
export default mamDesignSystem;

// Type exports
export type { ThemeMode } from './theme';
export type { 
  ContainerProps, 
  GridProps, 
  FlexProps, 
  StackProps,
  MAMLayoutProps,
  AssetBrowserProps 
} from './components/layout';
export type { 
  ButtonVariantProps, 
  ButtonGroupVariantProps,
  IconButtonVariantProps,
  FABVariantProps 
} from './components/button';

// Convenience type for the design system
export type MAMDesignSystem = typeof mamDesignSystem;