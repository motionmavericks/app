'use client';

import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Asset } from '@/types/asset';
import { AssetCard } from './AssetCard';
import { useAssetStore } from '@/lib/stores/asset-store';
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

interface AssetBrowserProps {
  assets?: Asset[];
  loading?: boolean;
  error?: string | null;
  onAssetSelect?: (asset: Asset) => void;
}

export function AssetBrowser({ 
  assets: propAssets, 
  loading: propLoading, 
  error: propError,
  onAssetSelect 
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

  // Get sorted assets for display
  const sortedAssets = getSortedAssets();

  // Grid configuration
  const gridCols = viewMode === 'grid' ? 4 : 1;
  const itemHeight = viewMode === 'grid' ? 280 : 80;
  const itemsPerRow = viewMode === 'grid' ? gridCols : 1;

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: Math.ceil(sortedAssets.length / itemsPerRow),
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });


  const handleSelectAll = () => {
    if (getSelectionCount() === sortedAssets.length) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const selectedCount = getSelectionCount();
  const allSelected = selectedCount === sortedAssets.length && sortedAssets.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < sortedAssets.length;

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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {/* Bulk selection */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              data-indeterminate={someSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected` : `${sortedAssets.length} assets`}
            </span>
          </div>

          {/* Batch actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedCount} selected</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
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

        <div className="flex items-center gap-2">
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

      {/* Asset grid/list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ contain: 'strict' }}
      >
        {sortedAssets.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No assets found</div>
              <div className="text-sm text-muted-foreground">
                Try uploading some assets or adjusting your filters
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
              const endIndex = Math.min(startIndex + itemsPerRow, sortedAssets.length);
              const rowAssets = sortedAssets.slice(startIndex, endIndex);

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                      {rowAssets.map((asset) => {
                        return (
                          <div key={asset.id} className="w-full">
                            <AssetCard
                              asset={asset}
                              viewMode="grid"
                              isSelected={isAssetSelected(asset.id)}
                              onSelect={() => onAssetSelect?.(asset)}
                              onToggleSelection={() => toggleAssetSelection(asset.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1 px-4">
                      {rowAssets.map((asset) => {
                        return (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            viewMode="list"
                            isSelected={isAssetSelected(asset.id)}
                            onSelect={() => onAssetSelect?.(asset)}
                            onToggleSelection={() => toggleAssetSelection(asset.id)}
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
  );
}