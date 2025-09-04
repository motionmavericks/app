/**
 * MAM Design System - Layout Components
 * Professional layout patterns for Media Asset Management
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Container component styles
export const containerVariants = cva(
  'w-full mx-auto px-4 sm:px-6 lg:px-8',
  {
    variants: {
      size: {
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
        xl: 'max-w-screen-2xl',
        full: 'max-w-none',
      },
      padding: {
        none: 'px-0',
        sm: 'px-2 sm:px-4',
        md: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-6 sm:px-8 lg:px-12',
      },
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md',
    },
  }
);

// Grid system for asset layouts
export const gridVariants = cva(
  'grid gap-4',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
        auto: 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))]',
        'asset-responsive': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
      },
      gap: {
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
      alignment: {
        start: 'justify-items-start',
        center: 'justify-items-center',
        end: 'justify-items-end',
        stretch: 'justify-items-stretch',
      },
    },
    defaultVariants: {
      cols: 'auto',
      gap: 'md',
      alignment: 'stretch',
    },
  }
);

// Flex utilities for layout
export const flexVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      wrap: {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
      },
    },
    defaultVariants: {
      direction: 'row',
      align: 'stretch',
      justify: 'start',
      wrap: 'nowrap',
      gap: 'md',
    },
  }
);

// Stack component for vertical layouts
export const stackVariants = cva(
  'flex flex-col',
  {
    variants: {
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
    },
    defaultVariants: {
      gap: 'md',
      align: 'stretch',
    },
  }
);

// Panel layout for sidebar/main content layouts
export const panelVariants = cva(
  'flex h-full',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
      divider: {
        none: '',
        border: '[&>*:not(:last-child)]:border-r',
        shadow: '[&>*:not(:last-child)]:shadow-[1px_0_0_0_theme(colors.border)]',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      divider: 'border',
    },
  }
);

// MAM-specific layout components
export const mamLayoutVariants = cva(
  'min-h-screen',
  {
    variants: {
      layout: {
        // Traditional MAM layout: sidebar + main
        'sidebar-main': 'grid grid-cols-[18rem_1fr] grid-rows-[auto_1fr_auto]',
        // Full-width with collapsible sidebar
        'collapsible-sidebar': 'grid grid-cols-[var(--sidebar-width,18rem)_1fr] grid-rows-[auto_1fr_auto] transition-[grid-template-columns] duration-300',
        // Mobile-first responsive layout
        'responsive': 'grid grid-rows-[auto_1fr_auto] lg:grid-cols-[18rem_1fr]',
        // Simple single column
        'single': 'flex flex-col',
      },
    },
    defaultVariants: {
      layout: 'sidebar-main',
    },
  }
);

// Asset browser specific layouts
export const assetBrowserVariants = cva(
  'flex h-full',
  {
    variants: {
      layout: {
        // Filters sidebar + browser
        'with-filters': 'grid grid-cols-[20rem_1fr]',
        // Just browser
        'browser-only': 'flex-col',
        // Responsive: filters collapse on mobile
        'responsive': 'flex-col lg:grid lg:grid-cols-[20rem_1fr]',
      },
      spacing: {
        tight: 'gap-2',
        normal: 'gap-4',
        loose: 'gap-6',
      },
    },
    defaultVariants: {
      layout: 'responsive',
      spacing: 'normal',
    },
  }
);

// Section dividers
export const dividerVariants = cva(
  '',
  {
    variants: {
      orientation: {
        horizontal: 'w-full h-px bg-border',
        vertical: 'h-full w-px bg-border',
      },
      style: {
        solid: 'bg-border',
        dashed: 'border-dashed border-t border-border bg-transparent',
        dotted: 'border-dotted border-t border-border bg-transparent',
        gradient: 'bg-gradient-to-r from-transparent via-border to-transparent',
      },
      spacing: {
        none: 'my-0',
        sm: 'my-2',
        md: 'my-4',
        lg: 'my-6',
        xl: 'my-8',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      style: 'solid',
      spacing: 'md',
    },
  }
);

// Scrollable areas
export const scrollAreaVariants = cva(
  'overflow-auto',
  {
    variants: {
      direction: {
        both: 'overflow-auto',
        vertical: 'overflow-y-auto overflow-x-hidden',
        horizontal: 'overflow-x-auto overflow-y-hidden',
        none: 'overflow-hidden',
      },
      scrollbar: {
        auto: '',
        thin: 'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border-hover',
        hidden: 'scrollbar-hide',
      },
      padding: {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      direction: 'both',
      scrollbar: 'thin',
      padding: 'none',
    },
  }
);

// Type exports for TypeScript
export type ContainerProps = VariantProps<typeof containerVariants>;
export type GridProps = VariantProps<typeof gridVariants>;
export type FlexProps = VariantProps<typeof flexVariants>;
export type StackProps = VariantProps<typeof stackVariants>;
export type PanelProps = VariantProps<typeof panelVariants>;
export type MAMLayoutProps = VariantProps<typeof mamLayoutVariants>;
export type AssetBrowserProps = VariantProps<typeof assetBrowserVariants>;
export type DividerProps = VariantProps<typeof dividerVariants>;
export type ScrollAreaProps = VariantProps<typeof scrollAreaVariants>;

// Utility functions for layout calculations
export const calculateGridColumns = (containerWidth: number, itemMinWidth: number, gap: number) => {
  const availableWidth = containerWidth - gap;
  const itemWidthWithGap = itemMinWidth + gap;
  return Math.floor(availableWidth / itemWidthWithGap) || 1;
};

export const calculateOptimalAssetCardSize = (
  containerWidth: number,
  minCardWidth: number = 200,
  maxCardWidth: number = 320,
  gap: number = 16
) => {
  const columns = calculateGridColumns(containerWidth, minCardWidth, gap);
  const totalGapWidth = (columns - 1) * gap;
  const availableWidth = containerWidth - totalGapWidth;
  const cardWidth = Math.min(maxCardWidth, availableWidth / columns);
  
  return {
    columns,
    cardWidth,
    cardHeight: cardWidth * (9 / 16) + 120, // 16:9 aspect ratio + metadata area
  };
};

// Layout component factory functions
export const createLayoutClasses = {
  container: (props: ContainerProps) => containerVariants(props),
  grid: (props: GridProps) => gridVariants(props),
  flex: (props: FlexProps) => flexVariants(props),
  stack: (props: StackProps) => stackVariants(props),
  panel: (props: PanelProps) => panelVariants(props),
  mamLayout: (props: MAMLayoutProps) => mamLayoutVariants(props),
  assetBrowser: (props: AssetBrowserProps) => assetBrowserVariants(props),
  divider: (props: DividerProps) => dividerVariants(props),
  scrollArea: (props: ScrollAreaProps) => scrollAreaVariants(props),
};

// Common layout compositions
export const layouts = {
  // Full-screen MAM interface
  fullMAM: cn(
    mamLayoutVariants({ layout: 'sidebar-main' }),
    'bg-background text-foreground'
  ),
  
  // Asset browser with filters
  assetBrowserWithFilters: cn(
    assetBrowserVariants({ layout: 'with-filters' }),
    'h-full bg-background'
  ),
  
  // Responsive card grid
  responsiveAssetGrid: cn(
    gridVariants({ cols: 'asset-responsive', gap: 'md' }),
    'p-6'
  ),
  
  // Sidebar navigation
  sidebarNav: cn(
    stackVariants({ gap: 'sm', align: 'stretch' }),
    'h-full w-72 border-r bg-card/30 p-4'
  ),
  
  // Main content area
  mainContent: cn(
    flexVariants({ direction: 'col', gap: 'none' }),
    'flex-1 overflow-hidden'
  ),
  
  // Toolbar layout
  toolbar: cn(
    flexVariants({ justify: 'between', align: 'center' }),
    'h-14 px-4 border-b bg-card/20'
  ),
  
  // Modal layout
  modal: cn(
    flexVariants({ direction: 'col', gap: 'md' }),
    'max-w-2xl max-h-[80vh] bg-background border rounded-lg shadow-xl p-6'
  ),
};

export default {
  variants: {
    containerVariants,
    gridVariants,
    flexVariants,
    stackVariants,
    panelVariants,
    mamLayoutVariants,
    assetBrowserVariants,
    dividerVariants,
    scrollAreaVariants,
  },
  utilities: {
    calculateGridColumns,
    calculateOptimalAssetCardSize,
    createLayoutClasses,
  },
  presets: layouts,
};