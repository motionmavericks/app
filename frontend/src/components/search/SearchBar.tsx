'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Star, Settings, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchStore } from '@/lib/stores/search-store';
import { debounce } from '@/lib/search';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search assets...',
  className = ''
}: SearchBarProps) {
  const {
    query,
    searchHistory,
    savedSearches,
    showAdvancedSearch,
    getActiveFiltersCount,
    hasActiveSearch,
    setQuery,
    addToHistory,
    clearHistory,
    removeFromHistory,
    loadSavedSearch,
    toggleAdvancedSearch,
    setIsSearching
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(query);
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = debounce((searchQuery: unknown) => {
    const query = searchQuery as string;
    setQuery(query);
    onSearch?.(query);
    setIsSearching(false);
    
    // Add to history if it's a meaningful search
    if (query.trim().length > 2) {
      addToHistory(query, 0); // Results count will be updated by parent
    }
  }, 300);

  // Handle input changes
  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    setIsSearching(true);
    debouncedSearch(value);
  };

  // Handle clear search
  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  // Handle history item click
  const handleHistoryItemClick = (historyQuery: string) => {
    setLocalQuery(historyQuery);
    setQuery(historyQuery);
    onSearch?.(historyQuery);
    setShowHistory(false);
    inputRef.current?.blur();
  };

  // Handle saved search click
  const handleSavedSearchClick = (savedSearchId: string) => {
    loadSavedSearch(savedSearchId);
    setShowHistory(false);
    inputRef.current?.blur();
    // Update local query to match loaded search
    const savedSearch = savedSearches.find(s => s.id === savedSearchId);
    if (savedSearch) {
      setLocalQuery(savedSearch.query.query);
      onSearch?.(savedSearch.query.query);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowHistory(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local query with store query
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setShowHistory(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Active filters indicator */}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}

          {/* Clear button */}
          {(localQuery || hasActiveSearch()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Advanced search toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAdvancedSearch}
            className={`h-8 w-8 p-0 hover:bg-muted ${showAdvancedSearch ? 'bg-muted' : ''}`}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* History dropdown trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search history and saved searches dropdown */}
      {showHistory && (isFocused || showHistory) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-auto">
          {/* Recent searches */}
          {searchHistory.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recent Searches</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              </div>
              <div className="py-1">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between group"
                    onClick={() => handleHistoryItemClick(item.query)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{item.query}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {item.resultsCount} results
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(index);
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Saved searches */}
          {savedSearches.length > 0 && (
            <>
              {searchHistory.length > 0 && <div className="border-t" />}
              <div className="px-3 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Saved Searches</span>
                </div>
              </div>
              <div className="py-1">
                {savedSearches.map((savedSearch) => (
                  <button
                    key={savedSearch.id}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                    onClick={() => handleSavedSearchClick(savedSearch.id)}
                  >
                    <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{savedSearch.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {savedSearch.query.query}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {searchHistory.length === 0 && savedSearches.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No search history yet</div>
              <div className="text-xs">Start searching to see your history here</div>
            </div>
          )}

          {/* Search suggestions */}
          {!localQuery && (
            <>
              <div className="border-t px-3 py-2">
                <span className="text-xs text-muted-foreground">Try searching for:</span>
              </div>
              <div className="py-1">
                {['video files', 'images from last week', 'type:video', 'status:published'].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="w-full px-3 py-2 text-left hover:bg-muted text-sm text-muted-foreground"
                    onClick={() => handleInputChange(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}