'use client';

import { useState, useCallback, useMemo } from 'react';
import { Asset } from '@/types/asset';
import { AssetCard } from './AssetCard';
import { GridControls } from './GridControls';
import { BatchActions } from './BatchActions';

interface AssetGridProps {
  assets: Asset[];
  onAssetSelect?: (asset: Asset) => void;
  onBatchAction?: (action: string, assetIds: string[]) => void;
}

export function AssetGrid({ assets, onAssetSelect, onBatchAction }: AssetGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleSelection = useCallback((assetId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredAndSorted.map(a => a.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const filteredAndSorted = useMemo(() => {
    let filtered = assets;

    // Apply text filter
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [assets, filterQuery, filterType, filterStatus, sortBy, sortOrder]);

  const handleBatchAction = useCallback((action: string) => {
    if (onBatchAction && selectedIds.size > 0) {
      onBatchAction(action, Array.from(selectedIds));
    }
  }, [selectedIds, onBatchAction]);

  return (
    <div className="flex flex-col h-full">
      <GridControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={(sort) => setSortBy(sort as "name" | "date" | "size" | "type")}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        filterQuery={filterQuery}
        onFilterQueryChange={setFilterQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        selectedCount={selectedIds.size}
        totalCount={filteredAndSorted.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />

      {selectedIds.size > 0 && (
        <BatchActions
          selectedCount={selectedIds.size}
          onAction={handleBatchAction}
          onClearSelection={clearSelection}
        />
      )}

      <div className={`flex-1 overflow-auto p-4 ${
        viewMode === 'grid' 
          ? 'grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
          : 'flex flex-col gap-2'
      }`}>
        {filteredAndSorted.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            viewMode={viewMode}
            isSelected={selectedIds.has(asset.id)}
            onSelect={() => onAssetSelect?.(asset)}
            onToggleSelection={() => toggleSelection(asset.id)}
          />
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          {filterQuery || filterType !== 'all' || filterStatus !== 'all'
            ? 'No assets match your filters'
            : 'No assets available'}
        </div>
      )}
    </div>
  );
}