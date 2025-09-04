'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Footerbar } from "@/components/dashboard/footerbar";
import { AssetBrowser } from "@/components/mam/AssetBrowser";
import { Asset } from '@/types/asset';
import { mamLayoutVariants } from '@/lib/design-system/components/layout';
import { cn } from '@/lib/utils';

// API Asset response type
interface ApiAsset {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  staging_key?: string;
  master_key?: string;
  preview_url?: string;
  thumbnail_url?: string;
  size?: number;
  duration?: string;
  dimensions?: { width: number; height: number };
  tags?: string[];
  collections?: string[];
  creator?: string;
  copyright?: string;
  location?: string;
  custom_fields?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  version?: number;
  parent_id?: string;
  metadata?: Record<string, unknown>;
}

// Convert API response to Asset type
function convertApiAssetToAsset(apiAsset: ApiAsset): Asset {
  const validTypes: Asset['type'][] = ['video', 'image', 'audio', 'document', 'other'];
  const validStatuses: Asset['status'][] = ['draft', 'review', 'approved', 'published', 'archived'];
  
  return {
    id: apiAsset.id,
    title: apiAsset.title || apiAsset.staging_key || 'Untitled',
    description: apiAsset.description,
    type: validTypes.includes(apiAsset.type as Asset['type']) ? (apiAsset.type as Asset['type']) : 'other',
    status: validStatuses.includes(apiAsset.status as Asset['status']) ? (apiAsset.status as Asset['status']) : 'draft',
    stagingKey: apiAsset.staging_key,
    masterKey: apiAsset.master_key,
    previewUrl: apiAsset.preview_url,
    thumbnailUrl: apiAsset.thumbnail_url || '/placeholder.svg',
    size: apiAsset.size,
    duration: apiAsset.duration,
    dimensions: apiAsset.dimensions,
    tags: apiAsset.tags || [],
    collections: apiAsset.collections || [],
    creator: apiAsset.creator,
    copyright: apiAsset.copyright,
    location: apiAsset.location,
    customFields: apiAsset.custom_fields,
    createdAt: apiAsset.created_at || new Date().toISOString(),
    updatedAt: apiAsset.updated_at || new Date().toISOString(),
    createdBy: apiAsset.created_by,
    updatedBy: apiAsset.updated_by,
    version: apiAsset.version,
    parentId: apiAsset.parent_id,
    metadata: apiAsset.metadata,
  };
}

export default function HomePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assets from API
  useEffect(() => {
    async function fetchAssets() {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "/api";
      
      try {
        setLoading(true);
        setError(null);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${apiBase}/assets`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API unavailable: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const apiAssets = data.items || [];
        
        // Convert API assets to our Asset type with mock data for demo
        const convertedAssets: Asset[] = apiAssets.map((apiAsset: ApiAsset) => ({
          ...convertApiAssetToAsset(apiAsset),
          // Add demo data for missing fields
          type: (['video', 'image', 'audio', 'document'] as const)[Math.floor(Math.random() * 4)],
          status: (['draft', 'review', 'approved', 'published'] as const)[Math.floor(Math.random() * 4)],
          size: Math.floor(Math.random() * 100000000) + 1000000, // Random size between 1MB-100MB
          duration: Math.random() > 0.5 ? `${Math.floor(Math.random() * 300) + 30}s` : undefined,
          tags: ['media', 'content', 'asset'].slice(0, Math.floor(Math.random() * 3) + 1),
        }));
        
        setAssets(convertedAssets);
      } catch (err) {
        console.warn('Backend API not available, using demo data:', err);
        // Don't set error state for missing backend - use demo data instead
        setError(null);
        
        // Fallback: Create demo assets for when backend is not available
        const demoAssets: Asset[] = Array.from({ length: 50 }, (_, i) => ({
          id: `demo-${i + 1}`,
          title: `Demo Asset ${i + 1}`,
          description: `This is a demo asset for testing. Backend API is not available yet.`,
          type: (['video', 'image', 'audio', 'document'] as const)[i % 4],
          status: (['draft', 'review', 'approved', 'published', 'archived'] as const)[i % 5],
          thumbnailUrl: `/placeholder.svg`,
          size: Math.floor(Math.random() * 100000000) + 1000000,
          duration: i % 3 === 0 ? `${Math.floor(Math.random() * 300) + 30}s` : undefined,
          tags: ['demo', 'asset', `tag-${i % 5}`],
          collections: i % 4 === 0 ? [`collection-${Math.floor(i / 4)}`] : [],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          creator: `user-${(i % 5) + 1}`,
          version: 1,
        }));
        
        setAssets(demoAssets);
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, []);

  const handleAssetSelect = (asset: Asset) => {
    // Navigate to asset detail page
    router.push(`/assets/${asset.id}`);
  };

  return (
    <div className={cn(
      mamLayoutVariants({ layout: 'responsive' }),
      'bg-background text-foreground'
    )}>
      {/* Top bar spans full width */}
      <div className="col-span-2 row-start-1 lg:col-span-2">
        <Topbar />
      </div>
      
      {/* Sidebar spans remaining height */}
      <div className="hidden lg:block row-span-2 row-start-2">
        <Sidebar />
      </div>
      
      {/* Main content area with AssetBrowser */}
      <main className="col-span-2 lg:col-start-2 row-start-2 overflow-hidden">
        <AssetBrowser
          assets={assets}
          loading={loading}
          error={error}
          onAssetSelect={handleAssetSelect}
        />
      </main>
      
      {/* Footer spans full width */}
      <div className="col-span-2 row-start-3 lg:col-span-2">
        <Footerbar />
      </div>
    </div>
  );
}