import { Asset } from '@/types/asset';


export interface SearchFilters {
  type?: string[];
  status?: string[];
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  creator?: string[];
  collections?: string[];
}

export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: Date;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultsCount: number;
}

/**
 * Debounce utility for search input
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Search assets based on query and filters
 */
export function searchAssets(
  assets: Asset[],
  query: string,
  filters: SearchFilters
): Asset[] {
  let filteredAssets = [...assets];

  // Apply text search
  if (query.trim()) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    filteredAssets = filteredAssets.filter(asset => {
      const searchableText = [
        asset.title,
        asset.description || '',
        ...(asset.tags || []),
        asset.creator || '',
        asset.location || '',
        ...Object.values(asset.customFields || {})
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Apply filters
  if (filters.type && filters.type.length > 0) {
    filteredAssets = filteredAssets.filter(asset => 
      filters.type!.includes(asset.type)
    );
  }

  if (filters.status && filters.status.length > 0) {
    filteredAssets = filteredAssets.filter(asset => 
      filters.status!.includes(asset.status)
    );
  }

  if (filters.tags && filters.tags.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      asset.tags?.some(tag => filters.tags!.includes(tag))
    );
  }

  if (filters.creator && filters.creator.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      asset.creator && filters.creator!.includes(asset.creator)
    );
  }

  if (filters.collections && filters.collections.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      asset.collections?.some(collection => filters.collections!.includes(collection))
    );
  }

  if (filters.dateRange) {
    filteredAssets = filteredAssets.filter(asset => {
      const assetDate = new Date(asset.createdAt);
      return assetDate >= filters.dateRange!.from && assetDate <= filters.dateRange!.to;
    });
  }

  if (filters.sizeRange) {
    filteredAssets = filteredAssets.filter(asset => {
      const size = asset.size || 0;
      return size >= filters.sizeRange!.min && size <= filters.sizeRange!.max;
    });
  }

  return filteredAssets;
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(
  text: string,
  searchQuery: string
): string {
  if (!searchQuery.trim()) return text;
  
  const terms = searchQuery.toLowerCase().split(/\s+/);
  let highlightedText = text;
  
  terms.forEach(term => {
    if (term) {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
      );
    }
  });
  
  return highlightedText;
}

/**
 * Parse advanced search query
 */
export function parseAdvancedQuery(query: string): {
  terms: string[];
  exactPhrases: string[];
  excludeTerms: string[];
  fieldQueries: Record<string, string>;
} {
  const terms: string[] = [];
  const exactPhrases: string[] = [];
  const excludeTerms: string[] = [];
  const fieldQueries: Record<string, string> = {};

  // Extract quoted phrases
  const phraseMatches = query.match(/"([^"]*)"/g);
  if (phraseMatches) {
    phraseMatches.forEach(match => {
      const phrase = match.slice(1, -1); // Remove quotes
      exactPhrases.push(phrase);
      query = query.replace(match, ''); // Remove from main query
    });
  }

  // Extract field queries (field:value)
  const fieldMatches = query.match(/(\w+):(\w+)/g);
  if (fieldMatches) {
    fieldMatches.forEach(match => {
      const [field, value] = match.split(':');
      fieldQueries[field] = value;
      query = query.replace(match, ''); // Remove from main query
    });
  }

  // Extract exclude terms (-term)
  const excludeMatches = query.match(/-(\w+)/g);
  if (excludeMatches) {
    excludeMatches.forEach(match => {
      const term = match.slice(1); // Remove minus
      excludeTerms.push(term);
      query = query.replace(match, ''); // Remove from main query
    });
  }

  // Remaining terms
  const remainingTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
  terms.push(...remainingTerms);

  return {
    terms,
    exactPhrases,
    excludeTerms,
    fieldQueries
  };
}

/**
 * Advanced asset search with complex query parsing
 */
export function advancedSearchAssets(
  assets: Asset[],
  query: string,
  filters: SearchFilters
): Asset[] {
  const parsedQuery = parseAdvancedQuery(query);
  
  const filteredAssets = assets.filter(asset => {
    const searchableText = [
      asset.title,
      asset.description || '',
      ...(asset.tags || []),
      asset.creator || '',
      asset.location || '',
      ...Object.values(asset.customFields || {})
    ].join(' ').toLowerCase();

    // Check regular terms
    const hasAllTerms = parsedQuery.terms.every(term => 
      searchableText.includes(term.toLowerCase())
    );

    // Check exact phrases
    const hasAllPhrases = parsedQuery.exactPhrases.every(phrase => 
      searchableText.includes(phrase.toLowerCase())
    );

    // Check excluded terms
    const hasNoExcludeTerms = parsedQuery.excludeTerms.every(term => 
      !searchableText.includes(term.toLowerCase())
    );

    // Check field queries
    const matchesFieldQueries = Object.entries(parsedQuery.fieldQueries).every(([field, value]) => {
      switch (field) {
        case 'type':
          return asset.type === value;
        case 'status':
          return asset.status === value;
        case 'creator':
          return asset.creator?.toLowerCase().includes(value.toLowerCase());
        case 'tag':
          return asset.tags?.some(tag => tag.toLowerCase().includes(value.toLowerCase()));
        default:
          return true;
      }
    });

    return hasAllTerms && hasAllPhrases && hasNoExcludeTerms && matchesFieldQueries;
  });

  // Apply regular filters
  return searchAssets(filteredAssets, '', filters);
}

/**
 * Get unique values for filter options
 */
export function getFilterOptions(assets: Asset[]) {
  const types = [...new Set(assets.map(asset => asset.type))];
  const statuses = [...new Set(assets.map(asset => asset.status))];
  const tags = [...new Set(assets.flatMap(asset => asset.tags || []))];
  const creators = [...new Set(assets.map(asset => asset.creator).filter(Boolean) as string[])];
  const collections = [...new Set(assets.flatMap(asset => asset.collections || []))];

  return {
    types: types.sort(),
    statuses: statuses.sort(),
    tags: tags.sort(),
    creators: creators.sort(),
    collections: collections.sort()
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Format date range for display
 */
export function formatDateRange(from: Date, to: Date): string {
  const fromStr = from.toLocaleDateString();
  const toStr = to.toLocaleDateString();
  
  if (fromStr === toStr) {
    return fromStr;
  }
  
  return `${fromStr} - ${toStr}`;
}