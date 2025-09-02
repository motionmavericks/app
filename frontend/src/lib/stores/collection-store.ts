import { create } from 'zustand';
import { Collection, CollectionFolder, SmartCollectionRule, CollectionShare } from '@/types/collection';
import { Asset } from '@/types/asset';

interface CollectionStore {
  // Collections data
  collections: Collection[];
  folders: CollectionFolder[];
  currentCollection: Collection | null;
  shares: CollectionShare[];
  
  // UI state
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  sidebarExpanded: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  setCollections: (collections: Collection[]) => void;
  setFolders: (folders: CollectionFolder[]) => void;
  setCurrentCollection: (collection: Collection | null) => void;
  setSelectedCollectionId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Collection operations
  createCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addAssetsToCollection: (collectionId: string, assetIds: string[]) => void;
  removeAssetsFromCollection: (collectionId: string, assetIds: string[]) => void;
  duplicateCollection: (id: string) => void;
  
  // Smart collections
  evaluateSmartCollection: (rules: SmartCollectionRule[], assets: Asset[]) => Asset[];
  updateSmartCollection: (collectionId: string) => void;
  
  // Folder operations
  createFolder: (name: string, parentId?: string) => void;
  updateFolder: (id: string, updates: Partial<CollectionFolder>) => void;
  deleteFolder: (id: string) => void;
  moveCollection: (collectionId: string, folderId?: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  
  // Sharing
  createShare: (collectionId: string, share: Omit<CollectionShare, 'id' | 'createdAt'>) => void;
  deleteShare: (shareId: string) => void;
  getCollectionShares: (collectionId: string) => CollectionShare[];
  
  // Getters
  getCollection: (id: string) => Collection | undefined;
  getCollectionAssets: (collectionId: string, allAssets: Asset[]) => Asset[];
  getFlatCollections: () => Collection[];
  getCollectionsByFolder: (folderId?: string) => Collection[];
  searchCollections: (query: string) => Collection[];
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  // Initial state
  collections: [],
  folders: [],
  currentCollection: null,
  shares: [],
  selectedCollectionId: null,
  selectedFolderId: null,
  sidebarExpanded: true,
  loading: false,
  error: null,
  
  // Basic setters
  setCollections: (collections) => set({ collections }),
  setFolders: (folders) => set({ folders }),
  setCurrentCollection: (collection) => set({ currentCollection: collection }),
  setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Collection operations
  createCollection: (collectionData) => set((state) => {
    const newCollection: Collection = {
      ...collectionData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return {
      collections: [...state.collections, newCollection],
    };
  }),
  
  updateCollection: (id, updates) => set((state) => ({
    collections: state.collections.map(collection =>
      collection.id === id
        ? { ...collection, ...updates, updatedAt: new Date().toISOString() }
        : collection
    ),
  })),
  
  deleteCollection: (id) => set((state) => ({
    collections: state.collections.filter(collection => collection.id !== id),
    selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
    currentCollection: state.currentCollection?.id === id ? null : state.currentCollection,
  })),
  
  addAssetsToCollection: (collectionId, assetIds) => set((state) => ({
    collections: state.collections.map(collection => {
      if (collection.id === collectionId && collection.type === 'manual') {
        const newAssetIds = [...new Set([...collection.assetIds, ...assetIds])];
        return {
          ...collection,
          assetIds: newAssetIds,
          assetCount: newAssetIds.length,
          updatedAt: new Date().toISOString(),
        };
      }
      return collection;
    }),
  })),
  
  removeAssetsFromCollection: (collectionId, assetIds) => set((state) => ({
    collections: state.collections.map(collection => {
      if (collection.id === collectionId && collection.type === 'manual') {
        const newAssetIds = collection.assetIds.filter(id => !assetIds.includes(id));
        return {
          ...collection,
          assetIds: newAssetIds,
          assetCount: newAssetIds.length,
          updatedAt: new Date().toISOString(),
        };
      }
      return collection;
    }),
  })),
  
  duplicateCollection: (id) => set((state) => {
    const original = state.collections.find(c => c.id === id);
    if (!original) return state;
    
    const duplicate: Collection = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return {
      collections: [...state.collections, duplicate],
    };
  }),
  
  // Smart collection evaluation
  evaluateSmartCollection: (rules, assets) => {
    return assets.filter(asset => {
      return rules.every(rule => {
        const fieldValue = rule.field === 'customField' && rule.customFieldKey
          ? asset.customFields?.[rule.customFieldKey]
          : asset[rule.field as keyof Asset];
        
        if (fieldValue === undefined || fieldValue === null) {
          return rule.operator === 'not' || rule.operator === 'exists' ? false : true;
        }
        
        switch (rule.operator) {
          case 'equals':
            return fieldValue === rule.value;
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
          case 'startsWith':
            return String(fieldValue).toLowerCase().startsWith(String(rule.value).toLowerCase());
          case 'endsWith':
            return String(fieldValue).toLowerCase().endsWith(String(rule.value).toLowerCase());
          case 'greaterThan':
            return Number(fieldValue) > Number(rule.value);
          case 'lessThan':
            return Number(fieldValue) < Number(rule.value);
          case 'between':
            if (typeof rule.value === 'object' && 'min' in rule.value && 'max' in rule.value) {
              const num = Number(fieldValue);
              return num >= rule.value.min && num <= rule.value.max;
            }
            return false;
          case 'in':
            if (Array.isArray(rule.value)) {
              return rule.value.includes(String(fieldValue));
            }
            return false;
          case 'not':
            return fieldValue !== rule.value;
          case 'exists':
            return true; // We already checked for undefined/null above
          case 'regex':
            try {
              const regex = new RegExp(String(rule.value), 'i');
              return regex.test(String(fieldValue));
            } catch {
              return false;
            }
          default:
            return false;
        }
      });
    });
  },
  
  updateSmartCollection: (collectionId) => {
    // This would typically trigger a re-evaluation of the smart collection
    // In a real app, this would call an API to recalculate the collection
    set((state) => ({
      collections: state.collections.map(collection =>
        collection.id === collectionId
          ? { ...collection, updatedAt: new Date().toISOString() }
          : collection
      ),
    }));
  },
  
  // Folder operations
  createFolder: (name, parentId) => set((state) => {
    const newFolder: CollectionFolder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      children: [],
      collections: [],
      isExpanded: true,
    };
    
    return {
      folders: [...state.folders, newFolder],
    };
  }),
  
  updateFolder: (id, updates) => set((state) => ({
    folders: state.folders.map(folder =>
      folder.id === id ? { ...folder, ...updates } : folder
    ),
  })),
  
  deleteFolder: (id) => set((state) => ({
    folders: state.folders.filter(folder => folder.id !== id),
    selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
  })),
  
  moveCollection: (collectionId, folderId) => set((state) => ({
    collections: state.collections.map(collection =>
      collection.id === collectionId
        ? { ...collection, parentId: folderId, updatedAt: new Date().toISOString() }
        : collection
    ),
  })),
  
  toggleFolderExpanded: (folderId) => set((state) => ({
    folders: state.folders.map(folder =>
      folder.id === folderId
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ),
  })),
  
  // Sharing operations
  createShare: (collectionId, shareData) => set((state) => {
    const newShare: CollectionShare = {
      ...shareData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    return {
      shares: [...state.shares, newShare],
    };
  }),
  
  deleteShare: (shareId) => set((state) => ({
    shares: state.shares.filter(share => share.id !== shareId),
  })),
  
  getCollectionShares: (collectionId) => {
    return get().shares.filter(share => share.collectionId === collectionId);
  },
  
  // Getters
  getCollection: (id) => {
    return get().collections.find(collection => collection.id === id);
  },
  
  getCollectionAssets: (collectionId, allAssets) => {
    const collection = get().getCollection(collectionId);
    if (!collection) return [];
    
    if (collection.type === 'smart' && collection.smartRules) {
      return get().evaluateSmartCollection(collection.smartRules, allAssets);
    }
    
    return allAssets.filter(asset => collection.assetIds.includes(asset.id));
  },
  
  getFlatCollections: () => {
    return get().collections;
  },
  
  getCollectionsByFolder: (folderId) => {
    return get().collections.filter(collection => collection.parentId === folderId);
  },
  
  searchCollections: (query) => {
    const { collections } = get();
    if (!query.trim()) return collections;
    
    const searchTerm = query.toLowerCase();
    return collections.filter(collection =>
      collection.name.toLowerCase().includes(searchTerm) ||
      collection.description?.toLowerCase().includes(searchTerm) ||
      collection.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },
}));