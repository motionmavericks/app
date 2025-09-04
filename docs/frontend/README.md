# Frontend Guide

**Motion Mavericks MAM Platform Frontend**  
**Next.js 15.5.2 with React 19.1.0**

This guide provides comprehensive documentation for the MAM platform's frontend architecture, components, and development patterns.

## 🏗️ Architecture Overview

### Technology Stack

The frontend is built with modern technologies optimized for performance and developer experience:

#### Core Framework
- **Next.js 15.5.2**: React framework with App Router and server-side rendering
- **React 19.1.0**: Latest React with concurrent features and improved performance
- **TypeScript 5+**: Full type safety across the entire frontend codebase

#### UI & Styling
- **Tailwind CSS 4.0**: Modern utility-first CSS framework
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Modern icon library with 1000+ icons
- **class-variance-authority**: Type-safe component variants

#### Media & Interaction
- **HLS.js 1.5.8**: HTTP Live Streaming for video playback
- **next-themes**: Dark/light theme management
- **Sonner**: Toast notification system

### Project Structure

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard layout group
│   │   ├── dashboard/           # Main dashboard page
│   │   ├── assets/              # Asset management pages
│   │   │   └── [id]/           # Dynamic asset detail pages
│   │   ├── collections/         # Collection management
│   │   ├── upload/              # File upload interface
│   │   └── layout.tsx          # Dashboard layout component
│   ├── api/                     # API route handlers
│   │   ├── health/              # Health check endpoint
│   │   └── presign/             # Presign URL generation
│   ├── globals.css              # Global styles and CSS variables
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── mam/                     # MAM-specific components
│   ├── dashboard/               # Dashboard components
│   ├── upload/                  # Upload-related components
│   └── providers/               # React context providers
├── lib/                         # Utility functions and configurations
│   ├── api.ts                   # API client functions
│   ├── auth.ts                  # Authentication utilities
│   ├── design-system/           # Design system tokens
│   └── utils/                   # General utilities
└── types/                       # TypeScript type definitions
```

## 🎨 Design System

### Component Architecture

The frontend uses a layered component architecture:

```
Application Components (pages, features)
          ↓
Business Components (MAM-specific)
          ↓
UI Components (Radix UI + custom)
          ↓
Design Tokens (colors, spacing, typography)
```

### Design Tokens

#### Color System
```typescript
// Defined in lib/design-system/tokens.ts
export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    900: '#14532d'
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444', 
    900: '#7f1d1d'
  },
  
  // Neutral colors (dark/light theme support)
  neutral: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827'
  }
};
```

#### Typography Scale
```typescript
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace']
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
  }
};
```

#### Spacing System
```typescript
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem'      // 96px
};
```

## 🧩 Component Library

### Base UI Components

Located in `components/ui/`, these are reusable components built on Radix UI:

#### Button Component
```typescript
// components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

#### Usage Example
```typescript
import { Button } from "@/components/ui/button";

// Different variants
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="destructive">Delete</Button>

// Different sizes
<Button size="sm">Small Button</Button>
<Button size="lg">Large Button</Button>
<Button size="icon"><Icon /></Button>
```

## 🧱 Build Notes

- Turbopack Root: Next.js may infer the wrong workspace root when multiple lockfiles exist. We explicitly set `turbopack.root` in `frontend/next.config.ts` to the `frontend/` directory to silence the warning and ensure correct asset discovery.
- Visual Tests: Playwright visual tests require local browsers or the provided `Dockerfile.playwright`. Use `npm run visual:init` to install and create a baseline, then `npm run test:visual`.
- Integration Tests (Edge): The `edge` service integration tests target `http://localhost:8080`. Start the service with `make edge-dev` (or `npm --prefix edge run dev`) before running those tests.

### MAM-Specific Components

Located in `components/mam/`, these are business logic components:

#### AssetBrowser Component
```typescript
// components/mam/AssetBrowser.tsx
import { useState, useEffect } from 'react';
import { AssetCard } from './AssetCard';
import { GridControls } from './GridControls';
import { useAssets } from '@/lib/hooks/use-assets';

interface AssetBrowserProps {
  viewMode: 'grid' | 'list';
  searchQuery?: string;
  sortBy?: 'title' | 'createdAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
  onAssetSelect: (assetId: string) => void;
}

export function AssetBrowser({
  viewMode,
  searchQuery,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onAssetSelect
}: AssetBrowserProps) {
  const { assets, loading, error, refetch } = useAssets({
    search: searchQuery,
    sortBy,
    sortOrder
  });

  if (loading) {
    return <AssetBrowserSkeleton />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <GridControls
        viewMode={viewMode}
        totalAssets={assets.length}
        onViewModeChange={onViewModeChange}
      />
      
      <div className={cn(
        "grid gap-4",
        viewMode === 'grid' 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1"
      )}>
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            viewMode={viewMode}
            onSelect={() => onAssetSelect(asset.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### MediaPlayer Component
```typescript
// components/mam/MediaPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { PlayIcon, PauseIcon, VolumeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useComments } from '@/lib/hooks/use-comments';

interface MediaPlayerProps {
  assetId: string;
  src: string;
  poster?: string;
  onTimeUpdate?: (time: number) => void;
  onCommentClick?: (comment: Comment) => void;
}

export function MediaPlayer({
  assetId,
  src,
  poster,
  onTimeUpdate,
  onCommentClick
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const { comments } = useComments(assetId);

  // Initialize HLS player
  useEffect(() => {
    if (videoRef.current && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    }
  }, [src]);

  // Handle play/pause
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        poster={poster}
        className="w-full aspect-video"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
      />

      {/* Player Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayback}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>

          {/* Progress Bar */}
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={([value]) => seekTo(value)}
              className="w-full"
            />
          </div>

          {/* Time Display */}
          <div className="text-white text-sm min-w-20">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <VolumeIcon className="text-white w-4 h-4" />
            <Slider
              value={[volume]}
              max={1}
              step={0.05}
              onValueChange={([value]) => {
                setVolume(value);
                if (videoRef.current) {
                  videoRef.current.volume = value;
                }
              }}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Comment Markers */}
      <div className="absolute bottom-16 left-4 right-4">
        <div className="relative h-2">
          {comments.map((comment) => (
            <button
              key={comment.id}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full hover:scale-125 transition-transform"
              style={{
                left: `${(comment.timestampSec / duration) * 100}%`
              }}
              onClick={() => {
                seekTo(comment.timestampSec);
                onCommentClick?.(comment);
              }}
              title={`${comment.userName}: ${comment.content}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 🎯 State Management

### React Context Pattern

The application uses React Context for state management:

#### Auth Context
```typescript
// components/providers/auth-provider.tsx
import { createContext, useContext, useReducer, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { token: string; refreshToken: string } };

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
      
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true
      };
      
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false };
      
    case 'LOGOUT':
      return initialState;
      
    case 'REFRESH_TOKEN':
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      };
      
    default:
      return state;
  }
}

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store tokens securely
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  // Auto-refresh tokens
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && refreshToken) {
      // Validate token and auto-refresh if needed
      // Implementation details...
    }
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Custom Hooks

#### useAssets Hook
```typescript
// lib/hooks/use-assets.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

interface Asset {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  versions: Version[];
  metadata?: Record<string, any>;
}

interface UseAssetsOptions {
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useAssets(options: UseAssetsOptions = {}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const { state: auth } = useAuth();

  const fetchAssets = async () => {
    if (!auth.token) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('order', options.sortOrder);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/assets?${params}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      const data = await response.json();
      setAssets(data.assets);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [auth.token, options.search, options.sortBy, options.sortOrder, options.page]);

  return {
    assets,
    loading,
    error,
    totalPages,
    refetch: fetchAssets
  };
}
```

## 🎨 Theming & Customization

### Theme System

The platform supports dark and light themes using `next-themes`:

#### Theme Provider Setup
```typescript
// components/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

#### CSS Variables for Theming
```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}
```

#### Theme Toggle Component
```typescript
// components/ui/theme-toggle.tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

## 🔄 Data Fetching

### API Client

Centralized API client with authentication and error handling:

```typescript
// lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

class APIError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new APIError(response.status, errorData.message, errorData.code);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: LoginCredentials) =>
      apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    register: (data: RegisterData) =>
      apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    refresh: (refreshToken: string) =>
      apiRequest<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      }),

    logout: () =>
      apiRequest<void>('/auth/logout', { method: 'POST' })
  },

  // Assets
  assets: {
    list: (params: AssetsListParams) =>
      apiRequest<AssetsListResponse>(`/api/assets?${new URLSearchParams(params)}`),

    get: (id: string) =>
      apiRequest<Asset>(`/api/assets/${id}`),

    create: (data: CreateAssetData) =>
      apiRequest<Asset>('/api/assets', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    update: (id: string, data: UpdateAssetData) =>
      apiRequest<Asset>(`/api/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    delete: (id: string) =>
      apiRequest<void>(`/api/assets/${id}`, { method: 'DELETE' })
  },

  // Upload
  presign: (data: PresignData) =>
    apiRequest<PresignResponse>('/api/presign', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  promote: (assetId: string) =>
    apiRequest<PromoteResponse>('/api/promote', {
      method: 'POST',
      body: JSON.stringify({ assetId })
    }),

  // Preview
  preview: {
    queue: (data: QueuePreviewData) =>
      apiRequest<QueuePreviewResponse>('/api/preview', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    status: (assetId: string) =>
      apiRequest<PreviewStatusResponse>(`/api/preview/status/${assetId}`),

    signUrl: (data: SignPreviewData) =>
      apiRequest<SignPreviewResponse>('/api/sign-preview', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};
```

### React Query Integration

For advanced caching and synchronization (optional):

```typescript
// lib/hooks/use-assets-query.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAssetsQuery(params: AssetsListParams) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => api.assets.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3
  });
}

export function useAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.assets.create,
    onSuccess: () => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}
```

## 📱 Responsive Design

### Breakpoint System

```typescript
// lib/design-system/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Small devices (phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X large devices
};

// Usage in Tailwind classes
// sm:text-sm md:text-base lg:text-lg xl:text-xl
```

### Mobile-First Components

```typescript
// components/ui/responsive-grid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveGrid({ children, className }: ResponsiveGridProps) {
  return (
    <div className={cn(
      // Mobile: 1 column
      "grid grid-cols-1 gap-4",
      // Tablet: 2 columns
      "sm:grid-cols-2",
      // Desktop: 3 columns
      "lg:grid-cols-3",
      // Large desktop: 4 columns
      "xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}
```

## 🚀 Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const MediaPlayer = lazy(() => import('@/components/mam/MediaPlayer'));
const MetadataEditor = lazy(() => import('@/components/mam/MetadataEditor'));

// Usage with Suspense
<Suspense fallback={<MediaPlayerSkeleton />}>
  <MediaPlayer src={videoUrl} />
</Suspense>
```

### Image Optimization

```typescript
// Using Next.js Image component
import Image from 'next/image';

<Image
  src={thumbnailUrl}
  alt={asset.title}
  width={300}
  height={200}
  className="rounded-lg object-cover"
  priority={index < 4} // Prioritize above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // Low-res placeholder
/>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze

# Webpack Bundle Analyzer will show:
# - Largest modules
# - Duplicate dependencies
# - Code splitting opportunities
```

## 🧪 Testing

### Component Testing

```typescript
// __tests__/components/AssetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetCard } from '@/components/mam/AssetCard';

const mockAsset = {
  id: '123',
  title: 'Test Video',
  createdAt: '2024-09-04T10:00:00Z',
  versions: [{
    id: '456',
    metadata: { duration: 120, resolution: '1920x1080' }
  }]
};

describe('AssetCard', () => {
  it('renders asset information correctly', () => {
    render(
      <AssetCard 
        asset={mockAsset} 
        viewMode="grid" 
        onSelect={jest.fn()} 
      />
    );

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument(); // Duration formatted
    expect(screen.getByText('1920x1080')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    
    render(
      <AssetCard 
        asset={mockAsset} 
        viewMode="grid" 
        onSelect={onSelect} 
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockAsset.id);
  });
});
```

### Integration Testing

```typescript
// __tests__/pages/dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import DashboardPage from '@/app/dashboard/page';

// Mock API responses
const server = setupServer(
  rest.get('/api/assets', (req, res, ctx) => {
    return res(ctx.json({
      assets: [mockAsset],
      pagination: { page: 1, totalPages: 1 }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard Page', () => {
  it('displays assets after loading', async () => {
    render(<DashboardPage />);

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for assets to load
    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
```

## 🔧 Development Workflow

### Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/new-component
git commit -m "feat: add new AssetCard component"
git push origin feature/new-component

# Pull request and merge to main
# Automatic deployment to staging/production
```

### Code Quality

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

---

This comprehensive frontend documentation covers all aspects of the MAM platform's frontend architecture, from components and state management to performance optimization and testing. The system is designed for scalability, maintainability, and an excellent developer experience.

**Next**: [Backend Services](../backend/README.md) | [API Reference](../api/README.md) | [Component Documentation](components/)
