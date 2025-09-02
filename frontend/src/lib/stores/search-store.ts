import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchFilters, SearchQuery, SavedSearch, SearchHistoryItem } from '@/lib/search';

interface SearchStore {
  // Current search state
  query: string;
  filters: SearchFilters;
  isSearching: boolean;
  
  // Search history
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  
  // UI state
  showAdvancedSearch: boolean;
  showFilters: boolean;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  updateFilter: (key: keyof SearchFilters, value: unknown) => void;
  clearFilters: () => void;
  setIsSearching: (searching: boolean) => void;
  
  // History actions
  addToHistory: (query: string, resultsCount: number) => void;
  clearHistory: () => void;
  removeFromHistory: (index: number) => void;
  
  // Saved searches actions
  saveSearch: (name: string, query: SearchQuery) => void;
  deleteSavedSearch: (id: string) => void;
  loadSavedSearch: (id: string) => void;
  
  // UI actions
  toggleAdvancedSearch: () => void;
  toggleFilters: () => void;
  
  // Computed
  getActiveFiltersCount: () => number;
  hasActiveSearch: () => boolean;
}

const initialFilters: SearchFilters = {
  type: [],
  status: [],
  tags: [],
  creator: [],
  collections: []
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      filters: initialFilters,
      isSearching: false,
      searchHistory: [],
      savedSearches: [],
      showAdvancedSearch: false,
      showFilters: false,
      
      // Basic actions
      setQuery: (query) => set({ query }),
      
      setFilters: (filters) => set({ filters }),
      
      updateFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),
      
      clearFilters: () => set({ filters: initialFilters }),
      
      setIsSearching: (searching) => set({ isSearching: searching }),
      
      // History actions
      addToHistory: (query, resultsCount) => set((state) => {
        // Don't add empty queries or duplicates
        if (!query.trim()) return state;
        
        const newItem: SearchHistoryItem = {
          query,
          timestamp: new Date(),
          resultsCount
        };
        
        // Remove existing entry if it exists
        const filteredHistory = state.searchHistory.filter(
          item => item.query !== query
        );
        
        // Add to beginning and limit to 20 items
        const newHistory = [newItem, ...filteredHistory].slice(0, 20);
        
        return { searchHistory: newHistory };
      }),
      
      clearHistory: () => set({ searchHistory: [] }),
      
      removeFromHistory: (index) => set((state) => ({
        searchHistory: state.searchHistory.filter((_, i) => i !== index)
      })),
      
      // Saved searches actions
      saveSearch: (name, query) => set((state) => {
        const newSavedSearch: SavedSearch = {
          id: Date.now().toString(),
          name,
          query,
          createdAt: new Date()
        };
        
        return {
          savedSearches: [...state.savedSearches, newSavedSearch]
        };
      }),
      
      deleteSavedSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter(search => search.id !== id)
      })),
      
      loadSavedSearch: (id) => {
        const state = get();
        const savedSearch = state.savedSearches.find(search => search.id === id);
        if (savedSearch) {
          set({
            query: savedSearch.query.query,
            filters: savedSearch.query.filters
          });
        }
      },
      
      // UI actions
      toggleAdvancedSearch: () => set((state) => ({
        showAdvancedSearch: !state.showAdvancedSearch
      })),
      
      toggleFilters: () => set((state) => ({
        showFilters: !state.showFilters
      })),
      
      // Computed
      getActiveFiltersCount: () => {
        const { filters } = get();
        let count = 0;
        
        if (filters.type && filters.type.length > 0) count++;
        if (filters.status && filters.status.length > 0) count++;
        if (filters.tags && filters.tags.length > 0) count++;
        if (filters.creator && filters.creator.length > 0) count++;
        if (filters.collections && filters.collections.length > 0) count++;
        if (filters.dateRange) count++;
        if (filters.sizeRange) count++;
        
        return count;
      },
      
      hasActiveSearch: () => {
        const { query } = get();
        return query.trim().length > 0 || get().getActiveFiltersCount() > 0;
      }
    }),
    {
      name: 'search-store',
      // Only persist certain fields
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        showFilters: state.showFilters
      })
    }
  )
);