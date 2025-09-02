'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { useAssetStore } from '@/lib/stores/asset-store';
import { Collection } from '@/types/collection';
import { Asset } from '@/types/asset';
import { CollectionSidebar } from '@/components/collections/CollectionSidebar';
import { CollectionCreator } from '@/components/collections/CollectionCreator';
import { CollectionSharing } from '@/components/collections/CollectionSharing';
import { AssetBrowser } from '@/components/mam/AssetBrowser';
import { DraggedItem, DropTarget } from '@/lib/drag-drop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Share,
  Copy,
  Trash2,
  FolderOpen as CollectionIcon,
  Hash,
  Grid3X3,
  List,
  FolderPlus,
  Users,
  Download,
  Archive,
  Tag,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Mock data for demonstration
const MOCK_COLLECTIONS: Collection[] = [
  {
    id: '1',
    name: 'Product Videos',
    description: 'All product demonstration videos',
    type: 'manual',
    assetIds: ['asset1', 'asset2', 'asset3'],
    assetCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    createdBy: 'user1',
    isPublic: true,
    tags: ['product', 'demo'],
    color: 'blue',
  },
  {
    id: '2',
    name: 'Recent Uploads',
    description: 'Assets uploaded in the last 30 days',
    type: 'smart',
    assetIds: [],
    assetCount: 12,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
    createdBy: 'user1',
    isPublic: false,
    tags: ['recent', 'new'],
    color: 'green',
    smartRules: [
      {
        id: 'rule1',
        field: 'createdAt',
        operator: 'greaterThan',
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: '3',
    name: 'Marketing Assets',
    description: 'Images and videos for marketing campaigns',
    type: 'manual',
    assetIds: ['asset4', 'asset5'],
    assetCount: 2,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'user2',
    isPublic: true,
    tags: ['marketing', 'campaign'],
    color: 'purple',
  },
];

const MOCK_ASSETS: Asset[] = [
  {
    id: 'asset1',
    title: 'Product Demo 1',
    type: 'video',
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    size: 1024000,
    thumbnailUrl: '/api/placeholder/300/200',
  },
  {
    id: 'asset2',
    title: 'Product Demo 2',
    type: 'video',
    status: 'published',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    size: 2048000,
    thumbnailUrl: '/api/placeholder/300/200',
  },
  {
    id: 'asset3',
    title: 'Product Screenshot',
    type: 'image',
    status: 'published',
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
    size: 512000,
    thumbnailUrl: '/api/placeholder/300/200',
  },
  {
    id: 'asset4',
    title: 'Banner Design',
    type: 'image',
    status: 'review',
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
    size: 256000,
    thumbnailUrl: '/api/placeholder/300/200',
  },
  {
    id: 'asset5',
    title: 'Campaign Video',
    type: 'video',
    status: 'draft',
    createdAt: '2024-01-19T10:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z',
    size: 3072000,
    thumbnailUrl: '/api/placeholder/300/200',
  },
];

export default function CollectionsPage() {
  const router = useRouter();
  const {
    collections,
    selectedCollectionId,
    currentCollection,
    setCollections,
    setCurrentCollection,
    getCollectionAssets,
    duplicateCollection,
    deleteCollection,
    addAssetsToCollection,
  } = useCollectionStore();

  const { assets, setAssets } = useAssetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Load mock data
  useEffect(() => {
    setCollections(MOCK_COLLECTIONS);
    setAssets(MOCK_ASSETS);
  }, [setCollections, setAssets]);

  const handleCollectionSelect = (collection: Collection) => {
    setCurrentCollection(collection);
    router.push(`/collections/${collection.id}`);
  };

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setShowCreateModal(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowCreateModal(true);
  };

  const handleShareCollection = (collection: Collection) => {
    setCurrentCollection(collection);
    setShowSharingModal(true);
  };

  const handleAssetDropOnCollection = (draggedItem: DraggedItem, dropTarget: DropTarget) => {
    if (draggedItem.type === 'asset') {
      const asset = draggedItem.data as Asset;
      addAssetsToCollection(dropTarget.id, [asset.id]);
      // Show success toast
      console.log(`Added asset "${asset.title}" to collection`);
    } else if (draggedItem.type === 'assets') {
      const assets = draggedItem.data as Asset[];
      const assetIds = assets.map(a => a.id);
      addAssetsToCollection(dropTarget.id, assetIds);
      // Show success toast
      console.log(`Added ${assets.length} assets to collection`);
    }
  };

  const filteredCollections = searchQuery
    ? collections.filter(collection =>
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : collections;

  const renderCollectionCard = (collection: Collection) => (
    <Card
      key={collection.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleCollectionSelect(collection)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {collection.type === 'smart' ? (
              <Hash className="h-5 w-5 text-blue-500" />
            ) : (
              <CollectionIcon className="h-5 w-5 text-muted-foreground" />
            )}
            <div
              className="w-3 h-3 rounded-full"
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
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleEditCollection(collection);
              }}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                duplicateCollection(collection.id);
              }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleShareCollection(collection);
              }}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCollection(collection.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <CardTitle className="text-lg">{collection.name}</CardTitle>
          {collection.description && (
            <CardDescription className="mt-1">
              {collection.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Archive className="h-4 w-4" />
              {collection.assetCount} assets
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}
            </span>
            {collection.isPublic && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Public
              </span>
            )}
          </div>

          {/* Tags */}
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {collection.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {collection.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{collection.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Type indicator */}
          <div className="flex items-center justify-between">
            <Badge
              variant={collection.type === 'smart' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {collection.type === 'smart' ? 'Smart' : 'Manual'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <CollectionSidebar
        onCollectionSelect={handleCollectionSelect}
        onCreateCollection={handleCreateCollection}
        onAssetDropOnCollection={handleAssetDropOnCollection}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Collections</h1>
              <p className="text-muted-foreground">
                Organize and manage your asset collections
              </p>
            </div>
            
            <Button onClick={handleCreateCollection}>
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none border-r"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Collections Grid/List */}
        <div className="flex-1 overflow-auto p-6">
          {filteredCollections.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CollectionIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No collections found' : 'No collections yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Create your first collection to organize your assets'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateCollection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Collection
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-4'
            }>
              {filteredCollections.map(collection =>
                viewMode === 'grid' 
                  ? renderCollectionCard(collection)
                  : (
                    <Card
                      key={collection.id}
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => handleCollectionSelect(collection)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {collection.type === 'smart' ? (
                              <Hash className="h-5 w-5 text-blue-500 shrink-0" />
                            ) : (
                              <CollectionIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium truncate">{collection.name}</h3>
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
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
                              </div>
                              {collection.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {collection.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <Badge variant="outline">
                              {collection.assetCount} assets
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCollection(collection);
                                }}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateCollection(collection.id);
                                }}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareCollection(collection);
                                }}>
                                  <Share className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCollection(collection.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CollectionCreator
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        editCollection={editingCollection}
      />

      <CollectionSharing
        open={showSharingModal}
        onOpenChange={setShowSharingModal}
        collection={currentCollection}
      />
    </div>
  );
}