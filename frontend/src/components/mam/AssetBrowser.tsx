'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Asset } from '@/types/asset';
import { AssetCard } from './AssetCard';
import { useAssetStore } from '@/lib/stores/asset-store';
import { useSearchStore } from '@/lib/stores/search-store';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { searchAssets, advancedSearchAssets } from '@/lib/search';
import { handleDragOver, handleDrop, DraggedItem, DropTarget } from '@/lib/drag-drop';
import { SearchBar } from '../search/SearchBar';
import { SearchFilters } from '../search/SearchFilters';
import { AdvancedSearch } from '../search/AdvancedSearch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Grid3X3,
  List,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Download,
  Trash2,
  Archive,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { 
  assetBrowserVariants, 
  flexVariants, 
  scrollAreaVariants 
} from '@/lib/design-system/components/layout';
import { mamButtonPresets } from '@/lib/design-system/components/button';
import { cn } from '@/lib/utils';

interface AssetBrowserProps {
  assets?: Asset[];
  loading?: boolean;
  error?: string | null;
  onAssetSelect?: (asset: Asset) => void;
  onAssetsAddedToCollection?: (assetIds: string[], collectionId: string) => void;
}

export function AssetBrowser({ 
  assets: propAssets, 
  loading: propLoading, 
  error: propError,
  onAssetSelect,
  onAssetsAddedToCollection
}: AssetBrowserProps) {
  const {
    viewMode,
    sortField,
    sortOrder,
    loading: storeLoading,
    error: storeError,
    setViewMode,
    toggleSort,
    toggleAssetSelection,
    selectAll,
    deselectAll,
    getSortedAssets,
    isAssetSelected,
    getSelectionCount,
    setAssets,
    setLoading,
    setError,
  } = useAssetStore();

  const {
    query,
    filters,
    hasActiveSearch,
    addToHistory
  } = useSearchStore();

  const { addAssetsToCollection } = useCollectionStore();

  // Use props if provided, otherwise use store
  const loading = propLoading !== undefined ? propLoading : storeLoading;
  const error = propError !== undefined ? propError : storeError;

  // Update store when props change
  useEffect(() => {
    if (propAssets) {
      setAssets(propAssets);
    }
    if (propLoading !== undefined) {
      setLoading(propLoading);
    }
    if (propError !== undefined) {
      setError(propError);
    }
  }, [propAssets, propLoading, propError, setAssets, setLoading, setError]);

  const parentRef = useRef<HTMLDivElement>(null);

  // Get base assets (props or store)
  const baseAssets = propAssets || getSortedAssets();

  // Apply search and filters
  const filteredAssets = useMemo(() => {
    if (!hasActiveSearch()) {
      return baseAssets;
    }

    // Use advanced search if query contains special syntax
    const hasAdvancedSyntax = query.includes(':') || query.includes('"') || query.includes('-');
    
    if (hasAdvancedSyntax) {
      return advancedSearchAssets(baseAssets, query, filters);
    } else {
      return searchAssets(baseAssets, query, filters);
    }
  }, [baseAssets, query, filters, hasActiveSearch]);

  // Update search history when results change
  useEffect(() => {
    if (query.trim() && filteredAssets.length !== undefined) {
      const timer = setTimeout(() => {
        addToHistory(query, filteredAssets.length);
      }, 1000); // Wait 1 second after search completes
      
      return () => clearTimeout(timer);
    }
  }, [query, filteredAssets.length, addToHistory]);

  // Handle search
  const handleSearch = () => {
    // The search store handles the query update
    // Filtering happens automatically via useMemo above
  };

  const handleAssetDragStart = (asset: Asset | Asset[], isMultiple: boolean) => {
    // Optional: Add visual feedback for drag operation
    console.log(`Dragging ${isMultiple ? 'multiple' : 'single'} asset(s)`);
  };

  const handleAssetDropOnCollection = (draggedItem: DraggedItem, dropTarget: DropTarget) => {
    if (draggedItem.type === 'asset') {
      const asset = draggedItem.data as Asset;
      addAssetsToCollection(dropTarget.id, [asset.id]);
      onAssetsAddedToCollection?.([asset.id], dropTarget.id);
    } else if (draggedItem.type === 'assets') {
      const assets = draggedItem.data as Asset[];
      const assetIds = assets.map(a => a.id);
      addAssetsToCollection(dropTarget.id, assetIds);
      onAssetsAddedToCollection?.(assetIds, dropTarget.id);
    }
  };

  // Grid configuration
  const gridCols = viewMode === 'grid' ? 4 : 1;
  const itemHeight = viewMode === 'grid' ? 280 : 80;
  const itemsPerRow = viewMode === 'grid' ? gridCols : 1;

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: Math.ceil(filteredAssets.length / itemsPerRow),
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });


  const handleSelectAll = () => {
    if (getSelectionCount() === filteredAssets.length) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const selectedCount = getSelectionCount();
  const allSelected = selectedCount === filteredAssets.length && filteredAssets.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < filteredAssets.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading assets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading assets: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn(
      assetBrowserVariants({ layout: 'responsive', spacing: 'normal' }),
      'h-full bg-background'
    )}>
      {/* Search Filters Sidebar */}
      <SearchFilters assets={baseAssets} />
      
      <div className={cn(
        flexVariants({ direction: 'col', gap: 'none' }),
        'flex-1 min-w-0'
      )}>
        {/* Search Bar */}
        <div className="p-6 border-b bg-card/20 backdrop-blur-sm">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Toolbar */}
        <div className={cn(
          flexVariants({ justify: 'between', align: 'center', gap: 'md' }),
          'px-6 py-4 border-b bg-card/10',
          'backdrop-blur-sm sticky top-0 z-10'
        )}>
        <div className={cn(
          flexVariants({ align: 'center', gap: 'md' }),
          'flex-1 min-w-0'
        )}>
          {/* Bulk selection */}
          <div className={cn(
            flexVariants({ align: 'center', gap: 'sm' }),
            'shrink-0'
          )}>
            <Checkbox
              checked={allSelected}
              data-indeterminate={someSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground font-medium">
              {selectedCount > 0 ? `${selectedCount} selected` : `${filteredAssets.length} assets`}
              {hasActiveSearch() && (
                <span className="text-xs text-muted-foreground ml-2">
                  (filtered from {baseAssets.length})
                </span>
              )}
            </span>
          </div>

          {/* Batch actions */}
          {selectedCount > 0 && (
            <div className={cn(
              flexVariants({ align: 'center', gap: 'sm' }),
              'ml-auto'
            )}>
              <Badge variant="secondary">{selectedCount} selected</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className={cn(mamButtonPresets.edit, 'h-9')}
                    variant="outline" 
                    size="sm"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add to Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tags
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className={cn(
          flexVariants({ align: 'center', gap: 'sm' }),
          'shrink-0'
        )}>
          {/* Sort controls */}
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field] = value.split('-') as [typeof sortField, typeof sortOrder];
              toggleSort(field);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value="createdAt-asc">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Oldest First
                </div>
              </SelectItem>
              <SelectItem value="title-asc">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Name A-Z
                </div>
              </SelectItem>
              <SelectItem value="title-desc">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Name Z-A
                </div>
              </SelectItem>
              <SelectItem value="size-desc">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Largest First
                </div>
              </SelectItem>
              <SelectItem value="size-asc">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Smallest First
                </div>
              </SelectItem>
              <SelectItem value="type-asc">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Type A-Z
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-card/30">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-r-none border-r-0 transition-all duration-200',
                viewMode === 'grid' ? 'shadow-sm' : 'hover:bg-accent/50'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-l-none border-l-0 transition-all duration-200',
                viewMode === 'list' ? 'shadow-sm' : 'hover:bg-accent/50'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

        {/* Asset grid/list */}
        <div
          ref={parentRef}
          className={cn(
            scrollAreaVariants({ 
              direction: 'vertical',
              scrollbar: 'thin', 
              padding: 'none' 
            }),
            'flex-1 bg-background'
          )}
          style={{ contain: 'strict' }}
        >
          {filteredAssets.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3 p-8">
                <div className="text-lg text-muted-foreground font-medium">
                  {hasActiveSearch() ? 'No assets match your search' : 'No assets found'}
                </div>
                <div className="text-sm text-muted-foreground max-w-md">
                  {hasActiveSearch() 
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                    : 'Get started by uploading your first assets or adjust your current filters.'
                  }
                </div>
              </div>
            </div>
          ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * itemsPerRow;
              const endIndex = Math.min(startIndex + itemsPerRow, filteredAssets.length);
              const rowAssets = filteredAssets.slice(startIndex, endIndex);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {viewMode === 'grid' ? (
                    <div className={cn(
                      'grid gap-6 p-6',
                      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
                      'auto-rows-max'
                    )}>
                      {rowAssets.map((asset) => {
                        return (
                          <div key={asset.id} className="w-full">
                            <AssetCard
                              asset={asset}
                              viewMode="grid"
                              isSelected={isAssetSelected(asset.id)}
                              searchQuery={query}
                              onSelect={() => onAssetSelect?.(asset)}
                              onToggleSelection={() => toggleAssetSelection(asset.id)}
                              selectedAssets={baseAssets.filter(a => isAssetSelected(a.id))}
                              onDragStart={handleAssetDragStart}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2 px-6">
                      {rowAssets.map((asset) => {
                        return (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            viewMode="list"
                            isSelected={isAssetSelected(asset.id)}
                            searchQuery={query}
                            onSelect={() => onAssetSelect?.(asset)}
                            onToggleSelection={() => toggleAssetSelection(asset.id)}
                            selectedAssets={baseAssets.filter(a => isAssetSelected(a.id))}
                            onDragStart={handleAssetDragStart}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearch 
        assets={baseAssets} 
        onSearch={handleSearch}
      />
    </div>
  );
}