import { create } from 'zustand';
import { Asset } from '@/types/asset';

export type SortField = 'createdAt' | 'title' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

interface AssetStore {
  // View state
  viewMode: ViewMode;
  sortField: SortField;
  sortOrder: SortOrder;
  
  // Selection state
  selectedAssets: Set<string>;
  
  // Asset data
  assets: Asset[];
  loading: boolean;
  error: string | null;
  
  // View actions
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSort: (field: SortField) => void;
  
  // Selection actions
  selectAsset: (assetId: string) => void;
  deselectAsset: (assetId: string) => void;
  toggleAssetSelection: (assetId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (fromId: string, toId: string) => void;
  
  // Asset data actions
  setAssets: (assets: Asset[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed getters
  getSelectedAssets: () => Asset[];
  getSortedAssets: () => Asset[];
  isAssetSelected: (assetId: string) => boolean;
  getSelectionCount: () => number;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  // Initial state
  viewMode: 'grid',
  sortField: 'createdAt',
  sortOrder: 'desc',
  selectedAssets: new Set(),
  assets: [],
  loading: false,
  error: null,
  
  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  
  toggleSort: (field) => set((state) => ({
    sortField: field,
    sortOrder: state.sortField === field && state.sortOrder === 'asc' ? 'desc' : 'asc',
  })),
  
  // Selection actions
  selectAsset: (assetId) => set((state) => ({
    selectedAssets: new Set([...state.selectedAssets, assetId])
  })),
  
  deselectAsset: (assetId) => set((state) => {
    const newSelection = new Set(state.selectedAssets);
    newSelection.delete(assetId);
    return { selectedAssets: newSelection };
  }),
  
  toggleAssetSelection: (assetId) => set((state) => {
    const newSelection = new Set(state.selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }
    return { selectedAssets: newSelection };
  }),
  
  selectAll: () => set((state) => ({
    selectedAssets: new Set(state.assets.map(asset => asset.id))
  })),
  
  deselectAll: () => set({ selectedAssets: new Set() }),
  
  selectRange: (fromId, toId) => set((state) => {
    const assets = state.assets;
    const fromIndex = assets.findIndex(asset => asset.id === fromId);
    const toIndex = assets.findIndex(asset => asset.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return state;
    
    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);
    
    const rangeIds = assets.slice(startIndex, endIndex + 1).map(asset => asset.id);
    const newSelection = new Set([...state.selectedAssets, ...rangeIds]);
    
    return { selectedAssets: newSelection };
  }),
  
  // Asset data actions
  setAssets: (assets) => set({ assets }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Computed getters
  getSelectedAssets: () => {
    const state = get();
    return state.assets.filter(asset => state.selectedAssets.has(asset.id));
  },
  
  getSortedAssets: () => {
    const state = get();
    const { assets, sortField, sortOrder } = state;
    
    return [...assets].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },
  
  isAssetSelected: (assetId) => get().selectedAssets.has(assetId),
  getSelectionCount: () => get().selectedAssets.size,
}));