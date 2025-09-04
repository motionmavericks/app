/**
 * MAM Design System - Button Component
 * Professional button variants for Media Asset Management
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base styles - professional, accessible, and consistent
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none cursor-pointer',
    // Enhanced accessibility
    'active:scale-[0.98] active:transition-transform active:duration-100',
  ],
  {
    variants: {
      variant: {
        // Primary - main actions (upload, save, create)
        primary: [
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
          'border border-primary hover:border-primary/90',
          'focus-visible:ring-primary/20',
        ],
        
        // Secondary - common actions (cancel, view, edit)  
        secondary: [
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
          'border border-secondary hover:border-secondary/80',
          'focus-visible:ring-secondary/20',
        ],
        
        // Accent - special actions (approve, promote, featured)
        accent: [
          'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90',
          'border border-accent hover:border-accent/90',
          'focus-visible:ring-accent/20',
        ],
        
        // Destructive - dangerous actions (delete, remove, archive)
        destructive: [
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
          'border border-destructive hover:border-destructive/90',
          'focus-visible:ring-destructive/20',
        ],
        
        // Outline - secondary actions with more emphasis than ghost
        outline: [
          'border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-accent/20',
        ],
        
        // Ghost - subtle actions (menu items, toolbar buttons)
        ghost: [
          'text-foreground hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-accent/20',
        ],
        
        // Link - text-like actions (breadcrumbs, inline links)
        link: [
          'text-primary underline-offset-4 hover:underline',
          'focus-visible:ring-primary/20 focus-visible:ring-offset-1',
        ],
        
        // Status-specific variants for MAM workflows
        
        // Draft - for draft content actions
        draft: [
          'bg-status-draft/10 text-status-draft border border-status-draft/20',
          'hover:bg-status-draft/20 hover:border-status-draft/30',
          'focus-visible:ring-status-draft/20',
        ],
        
        // Review - for review workflow actions
        review: [
          'bg-status-review/10 text-status-review border border-status-review/20',
          'hover:bg-status-review/20 hover:border-status-review/30',
          'focus-visible:ring-status-review/20',
        ],
        
        // Approved - for approved content actions
        approved: [
          'bg-status-approved/10 text-status-approved border border-status-approved/20',
          'hover:bg-status-approved/20 hover:border-status-approved/30',
          'focus-visible:ring-status-approved/20',
        ],
        
        // Published - for published content actions
        published: [
          'bg-status-published/10 text-status-published border border-status-published/20',
          'hover:bg-status-published/20 hover:border-status-published/30',
          'focus-visible:ring-status-published/20',
        ],
      },
      
      size: {
        // Extra small - for tight spaces, icon buttons
        xs: 'h-7 px-2 text-xs gap-1',
        
        // Small - for secondary actions, toolbar buttons
        sm: 'h-8 px-3 text-sm gap-1.5',
        
        // Default - standard button size
        md: 'h-10 px-4 py-2 text-sm gap-2',
        
        // Large - for primary actions, important CTAs
        lg: 'h-12 px-6 text-base gap-2',
        
        // Extra large - for hero actions, major CTAs
        xl: 'h-14 px-8 text-lg gap-3',
        
        // Icon only sizes
        'icon-xs': 'h-7 w-7',
        'icon-sm': 'h-8 w-8', 
        'icon-md': 'h-10 w-10',
        'icon-lg': 'h-12 w-12',
        'icon-xl': 'h-14 w-14',
      },
      
      // Visual weight for hierarchy
      weight: {
        light: 'font-normal shadow-none',
        normal: 'font-medium shadow-sm',
        bold: 'font-semibold shadow-md',
        heavy: 'font-bold shadow-lg',
      },
      
      // Corner radius variations
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
      
      // Width variations
      width: {
        auto: 'w-auto',
        full: 'w-full',
        fit: 'w-fit',
      },
      
      // Loading state
      loading: {
        true: 'cursor-wait opacity-70',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      weight: 'normal',
      radius: 'lg',
      width: 'auto',
      loading: false,
    },
    
    // Compound variants for specific combinations
    compoundVariants: [
      // Icon buttons should be square
      {
        size: ['icon-xs', 'icon-sm', 'icon-md', 'icon-lg', 'icon-xl'],
        className: 'aspect-square p-0',
      },
      
      // Ghost buttons with destructive intent
      {
        variant: 'ghost',
        className: 'hover:bg-destructive/10 hover:text-destructive data-[intent=destructive]:hover:bg-destructive data-[intent=destructive]:hover:text-destructive-foreground',
      },
      
      // Loading state adjustments
      {
        loading: true,
        className: 'pointer-events-none',
      },
      
      // Full width buttons shouldn't have transforms
      {
        width: 'full',
        className: 'active:scale-100',
      },
    ],
  }
);

// Button group variants for related actions
export const buttonGroupVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
      
      spacing: {
        none: 'gap-0',
        sm: 'gap-1',
        md: 'gap-2',
        lg: 'gap-4',
      },
      
      connected: {
        true: '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:border-l-0',
        false: '',
      },
      
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap',
      },
    },
    
    defaultVariants: {
      orientation: 'horizontal',
      spacing: 'sm',
      connected: false,
      wrap: false,
    },
  }
);

// Icon button specific variants
export const iconButtonVariants = cva(
  [
    buttonVariants(),
    'aspect-square p-0 flex-shrink-0',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-7 w-7 text-sm',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
        xl: 'h-12 w-12 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// FAB (Floating Action Button) variants for MAM
export const fabVariants = cva(
  [
    'fixed rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
    'flex items-center justify-center gap-2 font-medium',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'z-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-12 w-12 text-sm',
        md: 'h-14 w-14 text-base', 
        lg: 'h-16 w-16 text-lg',
      },
      
      position: {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6',
      },
      
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
      },
      
      extended: {
        true: 'px-6 w-auto min-w-[3.5rem]',
        false: 'p-0',
      },
    },
    
    defaultVariants: {
      size: 'md',
      position: 'bottom-right',
      variant: 'primary',
      extended: false,
    },
  }
);

// Type exports
export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonGroupVariantProps = VariantProps<typeof buttonGroupVariants>;
export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;
export type FABVariantProps = VariantProps<typeof fabVariants>;

// Common button combinations for MAM
export const mamButtonPresets = {
  // Upload button - primary action
  upload: buttonVariants({ 
    variant: 'primary', 
    size: 'lg', 
    weight: 'bold' 
  }),
  
  // Asset action buttons
  preview: buttonVariants({ 
    variant: 'outline', 
    size: 'sm' 
  }),
  
  download: buttonVariants({ 
    variant: 'secondary', 
    size: 'sm' 
  }),
  
  edit: buttonVariants({ 
    variant: 'ghost', 
    size: 'sm' 
  }),
  
  delete: buttonVariants({ 
    variant: 'destructive', 
    size: 'sm' 
  }),
  
  // Workflow buttons
  approve: buttonVariants({ 
    variant: 'approved', 
    size: 'sm' 
  }),
  
  reject: buttonVariants({ 
    variant: 'destructive', 
    size: 'sm' 
  }),
  
  publish: buttonVariants({ 
    variant: 'published', 
    size: 'md', 
    weight: 'bold' 
  }),
  
  // Toolbar buttons
  toolbarIcon: iconButtonVariants({ 
    size: 'sm' 
  }),
  
  // FAB for quick upload
  quickUpload: fabVariants({ 
    size: 'lg', 
    position: 'bottom-right', 
    variant: 'primary' 
  }),
};

export default {
  variants: {
    button: buttonVariants,
    buttonGroup: buttonGroupVariants,
    iconButton: iconButtonVariants,
    fab: fabVariants,
  },
  presets: mamButtonPresets,
};