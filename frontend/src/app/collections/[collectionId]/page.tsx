'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { useAssetStore } from '@/lib/stores/asset-store';
import { Collection } from '@/types/collection';
import { Asset } from '@/types/asset';
import { AssetBrowser } from '@/components/mam/AssetBrowser';
import { CollectionCreator } from '@/components/collections/CollectionCreator';
import { CollectionSharing } from '@/components/collections/CollectionSharing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MoreHorizontal,
  Edit2,
  Share,
  Copy,
  Trash2,
  Download,
  Plus,
  FolderOpen as CollectionIcon,
  Hash,
  Calendar,
  User,
  Eye,
  Globe,
  Lock,
  RefreshCw as Refresh,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// This would come from your API/data layer
const MOCK_COLLECTIONS = [
  {
    id: '1',
    name: 'Product Videos',
    description: 'All product demonstration videos showcasing our latest features and capabilities.',
    type: 'manual' as const,
    assetIds: ['asset1', 'asset2', 'asset3'],
    assetCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    createdBy: 'john.doe@example.com',
    isPublic: true,
    tags: ['product', 'demo', 'video'],
    color: 'blue',
  },
  {
    id: '2',
    name: 'Recent Uploads',
    description: 'Assets uploaded in the last 30 days',
    type: 'smart' as const,
    assetIds: [],
    assetCount: 12,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
    createdBy: 'jane.smith@example.com',
    isPublic: false,
    tags: ['recent', 'new'],
    color: 'green',
    smartRules: [
      {
        id: 'rule1',
        field: 'createdAt' as const,
        operator: 'greaterThan' as const,
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

const MOCK_ASSETS: Asset[] = [
  {
    id: 'asset1',
    title: 'Product Demo Video 1',
    description: 'Comprehensive walkthrough of our main product features',
    type: 'video',
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    size: 1024000,
    duration: '5:30',
    thumbnailUrl: '/api/placeholder/300/200',
    tags: ['product', 'demo', 'tutorial'],
    creator: 'John Doe',
  },
  {
    id: 'asset2',
    title: 'Product Demo Video 2',
    description: 'Advanced features and customization options',
    type: 'video',
    status: 'published',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    size: 2048000,
    duration: '8:15',
    thumbnailUrl: '/api/placeholder/300/200',
    tags: ['product', 'advanced', 'customization'],
    creator: 'Jane Smith',
  },
  {
    id: 'asset3',
    title: 'Product Screenshot Collection',
    description: 'High-quality screenshots of the product interface',
    type: 'image',
    status: 'published',
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
    size: 512000,
    dimensions: { width: 1920, height: 1080 },
    thumbnailUrl: '/api/placeholder/300/200',
    tags: ['product', 'screenshot', 'ui'],
    creator: 'Mike Johnson',
  },
];

export default function CollectionPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.collectionId as string;

  const {
    getCollection,
    getCollectionAssets,
    updateCollection,
    duplicateCollection,
    deleteCollection,
    evaluateSmartCollection,
    updateSmartCollection,
  } = useCollectionStore();

  const { assets, setAssets } = useAssetStore();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionAssets, setCollectionAssets] = useState<Asset[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    // In a real app, this would be an API call
    const mockCollection = MOCK_COLLECTIONS.find(c => c.id === collectionId);
    if (mockCollection) {
      setCollection(mockCollection);
      setAssets(MOCK_ASSETS);
      
      // Get assets for this collection
      if (mockCollection.type === 'manual') {
        const collAssets = MOCK_ASSETS.filter(asset => 
          mockCollection.assetIds.includes(asset.id)
        );
        setCollectionAssets(collAssets);
      } else if (mockCollection.type === 'smart' && mockCollection.smartRules) {
        // For demo, just show all recent assets
        const recentAssets = MOCK_ASSETS.filter(asset =>
          new Date(asset.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        setCollectionAssets(recentAssets);
      }
    }
    setLoading(false);
  }, [collectionId, setAssets]);

  const handleBack = () => {
    router.push('/collections');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleShare = () => {
    setShowSharingModal(true);
  };

  const handleDuplicate = () => {
    if (collection) {
      duplicateCollection(collection.id);
      // In real app, show success toast
    }
  };

  const handleDelete = () => {
    if (collection) {
      deleteCollection(collection.id);
      router.push('/collections');
    }
  };

  const handleRefreshSmart = () => {
    if (collection && collection.type === 'smart') {
      updateSmartCollection(collection.id);
      // In real app, this would re-evaluate the rules and update assets
    }
  };

  const handleAssetSelect = (asset: Asset) => {
    router.push(`/assets/${asset.id}`);
  };

  const handleAddAssets = () => {
    // In real app, this would open asset picker
    console.log('Add assets to collection');
  };

  const handleDownloadAll = () => {
    // In real app, this would trigger bulk download
    console.log('Download all collection assets');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Collection not found</h2>
          <p className="text-muted-foreground mb-4">
            The collection you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/collections"
                className="flex items-center gap-1"
              >
                Collections
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                {collection.type === 'smart' ? (
                  <Hash className="h-4 w-4 text-blue-500" />
                ) : (
                  <CollectionIcon className="h-4 w-4" />
                )}
                {collection.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: {
                    blue: '#3b82f6',
                    red: '#ef4444',
                    green: '#10b981',
                    yellow: '#f59e0b',
                    purple: '#8b5cf6',
                    pink: '#ec4899',
                    orange: '#f97316',
                    gray: '#6b7280',
                  }[collection.color || 'gray']
                }}
              />
              <h1 className="text-2xl font-bold truncate">{collection.name}</h1>
              <Badge
                variant={collection.type === 'smart' ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {collection.type === 'smart' ? 'Smart' : 'Manual'}
              </Badge>
              {collection.isPublic ? (
                <Globe className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {collection.description && (
              <p className="text-muted-foreground mb-3">
                {collection.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CollectionIcon className="h-4 w-4" />
                {collection.assetCount} assets
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Updated {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {collection.createdBy}
              </span>
              {collection.isPublic && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Public
                </span>
              )}
            </div>

            {/* Tags */}
            {collection.tags && collection.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {collection.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {collection.type === 'smart' && (
              <Button variant="outline" size="sm" onClick={handleRefreshSmart}>
                <Refresh className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            
            {collection.type === 'manual' && (
              <Button variant="outline" size="sm" onClick={handleAddAssets}>
                <Plus className="h-4 w-4 mr-2" />
                Add Assets
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Asset Browser */}
      <div className="flex-1 overflow-hidden">
        <AssetBrowser
          assets={collectionAssets}
          loading={false}
          error={null}
          onAssetSelect={handleAssetSelect}
        />
      </div>

      {/* Modals */}
      <CollectionCreator
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editCollection={collection}
      />

      <CollectionSharing
        open={showSharingModal}
        onOpenChange={setShowSharingModal}
        collection={collection}
      />
    </div>
  );
}