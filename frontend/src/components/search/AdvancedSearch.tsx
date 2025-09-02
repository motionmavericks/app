'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  X,
  Save,
  RefreshCw,
  Settings2,
  Code2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchStore } from '@/lib/stores/search-store';
import { SearchQuery, SavedSearch } from '@/lib/search';
import { Asset } from '@/types/asset';

interface AdvancedSearchProps {
  assets?: Asset[];
  onSearch?: (query: string) => void;
}

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  connector: 'AND' | 'OR';
}

const FIELD_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'tags', label: 'Tags' },
  { value: 'creator', label: 'Creator' },
  { value: 'type', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'location', label: 'Location' },
  { value: 'size', label: 'File Size' },
  { value: 'duration', label: 'Duration' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
];

const OPERATOR_OPTIONS = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: 'equals' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'not_contains', label: 'does not contain' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
    { value: 'between', label: 'between' },
  ],
  date: [
    { value: 'equals', label: 'on' },
    { value: 'after', label: 'after' },
    { value: 'before', label: 'before' },
    { value: 'between', label: 'between' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is one of' },
  ],
};

export function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const {
    showAdvancedSearch,
    savedSearches,
    toggleAdvancedSearch,
    saveSearch,
    setQuery
  } = useSearchStore();

  const [conditions, setConditions] = useState<QueryCondition[]>([
    {
      id: '1',
      field: 'title',
      operator: 'contains',
      value: '',
      connector: 'AND'
    }
  ]);

  const [queryBuilder, setQueryBuilder] = useState('');
  const [savedSearchName, setSavedSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  // Add new condition
  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: Date.now().toString(),
      field: 'title',
      operator: 'contains',
      value: '',
      connector: 'AND'
    };
    setConditions([...conditions, newCondition]);
  };

  // Remove condition
  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  // Update condition
  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  // Get operator options based on field type
  const getOperatorOptions = (field: string) => {
    switch (field) {
      case 'size':
      case 'duration':
        return OPERATOR_OPTIONS.number;
      case 'createdAt':
      case 'updatedAt':
        return OPERATOR_OPTIONS.date;
      case 'type':
      case 'status':
        return OPERATOR_OPTIONS.select;
      default:
        return OPERATOR_OPTIONS.text;
    }
  };

  // Generate query from conditions
  const generateQuery = () => {
    const queryParts: string[] = [];
    
    conditions.forEach((condition, index) => {
      if (!condition.value.trim()) return;
      
      let queryPart = '';
      
      // Add connector for non-first conditions
      if (index > 0) {
        queryPart += ` ${condition.connector} `;
      }
      
      // Build the condition
      switch (condition.operator) {
        case 'contains':
          queryPart += `${condition.field}:"${condition.value}"`;
          break;
        case 'equals':
          queryPart += `${condition.field}:${condition.value}`;
          break;
        case 'starts_with':
          queryPart += `${condition.field}:"${condition.value}*"`;
          break;
        case 'ends_with':
          queryPart += `${condition.field}:"*${condition.value}"`;
          break;
        case 'not_contains':
          queryPart += `-${condition.field}:"${condition.value}"`;
          break;
        case 'greater_than':
          queryPart += `${condition.field}:>${condition.value}`;
          break;
        case 'less_than':
          queryPart += `${condition.field}:<${condition.value}`;
          break;
        default:
          queryPart += `${condition.field}:"${condition.value}"`;
      }
      
      queryParts.push(queryPart);
    });
    
    return queryParts.join('');
  };

  // Execute search
  const executeSearch = () => {
    let finalQuery = '';
    
    if (activeTab === 'builder') {
      finalQuery = generateQuery();
    } else {
      finalQuery = queryBuilder;
    }
    
    if (finalQuery.trim()) {
      setQuery(finalQuery);
      onSearch?.(finalQuery);
      toggleAdvancedSearch();
    }
  };

  // Save current search
  const handleSaveSearch = () => {
    if (!savedSearchName.trim()) return;
    
    const searchQuery: SearchQuery = {
      query: activeTab === 'builder' ? generateQuery() : queryBuilder,
      filters: {},
      sortField: 'createdAt',
      sortOrder: 'desc'
    };
    
    saveSearch(savedSearchName, searchQuery);
    setSavedSearchName('');
    setShowSaveDialog(false);
  };

  // Load saved search
  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQueryBuilder(savedSearch.query.query);
    setActiveTab('raw');
  };

  // Clear all conditions
  const clearConditions = () => {
    setConditions([{
      id: '1',
      field: 'title',
      operator: 'contains',
      value: '',
      connector: 'AND'
    }]);
    setQueryBuilder('');
  };

  if (!showAdvancedSearch) return null;

  return (
    <Dialog open={showAdvancedSearch} onOpenChange={toggleAdvancedSearch}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Build complex search queries to find exactly what you&apos;re looking for
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Query Builder
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Raw Query
            </TabsTrigger>
            {savedSearches.length > 0 && (
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved Searches ({savedSearches.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Query Builder Tab */}
          <TabsContent value="builder" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conditions.map((condition, index) => (
                  <div key={condition.id} className="space-y-2">
                    {index > 0 && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={condition.connector}
                          onValueChange={(value: 'AND' | 'OR') =>
                            updateCondition(condition.id, { connector: value })
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {/* Field */}
                      <Select
                        value={condition.field}
                        onValueChange={(value) =>
                          updateCondition(condition.id, { field: value, operator: 'contains' })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator */}
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateCondition(condition.id, { operator: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorOptions(condition.field).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value */}
                      <Input
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(condition.id, { value: e.target.value })
                        }
                        placeholder="Enter value..."
                        className="flex-1"
                      />

                      {/* Remove button */}
                      {conditions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(condition.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="outline"
                    onClick={addCondition}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Condition
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={clearConditions}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Query Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generated Query</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-sm bg-muted p-2 rounded block overflow-x-auto">
                  {generateQuery() || 'No conditions defined'}
                </code>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Query Tab */}
          <TabsContent value="raw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Raw Query Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query-builder">Search Query</Label>
                  <Textarea
                    id="query-builder"
                    value={queryBuilder}
                    onChange={(e) => setQueryBuilder(e.target.value)}
                    placeholder="Enter advanced search query..."
                    className="h-32 font-mono text-sm"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Examples:</strong></p>
                  <p>• <code>title:&quot;vacation video&quot;</code> - Exact phrase in title</p>
                  <p>• <code>type:video AND status:published</code> - Multiple conditions</p>
                  <p>• <code>-tag:private</code> - Exclude assets with &quot;private&quot; tag</p>
                  <p>• <code>creator:john OR creator:jane</code> - Either creator</p>
                  <p>• <code>&quot;summer 2023&quot; tag:vacation</code> - Mixed search</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Searches Tab */}
          {savedSearches.length > 0 && (
            <TabsContent value="saved" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saved Searches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedSearches.map(savedSearch => (
                    <div
                      key={savedSearch.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{savedSearch.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {savedSearch.query.query}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Saved {new Date(savedSearch.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedSearch(savedSearch)}
                      >
                        Load
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Search
          </Button>
          
          <Button
            variant="outline"
            onClick={clearConditions}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear
          </Button>
          
          <Button
            onClick={executeSearch}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </DialogFooter>

        {/* Save Search Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Search</DialogTitle>
              <DialogDescription>
                Give your search a name to save it for later use.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={savedSearchName}
                onChange={(e) => setSavedSearchName(e.target.value)}
                placeholder="e.g., Published Videos from 2023"
              />
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSearch} disabled={!savedSearchName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}