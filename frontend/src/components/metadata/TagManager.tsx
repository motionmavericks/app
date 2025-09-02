'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Plus, 
  Tag, 
  Hash, 
  Search,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeTag, suggestTags } from '@/lib/metadata/validation';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  popularTags?: { tag: string; count: number }[];
  recentTags?: string[];
  allowCreate?: boolean;
  placeholder?: string;
  maxTags?: number;
  showSuggestions?: boolean;
  showStats?: boolean;
}

export function TagManager({ 
  tags, 
  onTagsChange, 
  suggestions = [], 
  popularTags = [],
  recentTags = [],
  allowCreate = true, 
  placeholder = 'Add a tag...',
  maxTags,
  showSuggestions = true,
  showStats = true
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Combine all available suggestions
  const allSuggestions = [
    ...suggestions,
    ...popularTags.map(t => t.tag),
    ...recentTags,
    ...autoSuggestions
  ].filter((tag, index, array) => 
    array.indexOf(tag) === index && // Remove duplicates
    !tags.includes(tag) && // Don't suggest already added tags
    tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    setFilteredSuggestions(allSuggestions.slice(0, 10));
  }, [inputValue, tags, JSON.stringify(allSuggestions)]);

  useEffect(() => {
    // Generate auto-suggestions based on existing tags and input
    if (inputValue.length > 2) {
      const contextSuggestions = suggestTags(inputValue, tags);
      setAutoSuggestions(contextSuggestions);
    } else {
      setAutoSuggestions([]);
    }
  }, [inputValue, tags]);

  const addTag = (tag: string) => {
    const sanitized = sanitizeTag(tag);
    if (
      sanitized && 
      !tags.includes(sanitized) && 
      (!maxTags || tags.length < maxTags)
    ) {
      onTagsChange([...tags, sanitized]);
      setInputValue('');
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(value.length > 0 || showSuggestions);
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        if (allowCreate) {
          addTag(inputValue.trim());
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue.trim() && allowCreate) {
        addTag(inputValue.trim());
      }
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicking on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setShowDropdown(false);
      }
    }, 150);
  };

  const getTagColor = (tag: string) => {
    // Simple color mapping based on tag content
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-pink-100 text-pink-800 border-pink-200'
    ];
    
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const categorizedSuggestions = {
    popular: popularTags.filter(p => 
      p.tag.toLowerCase().includes(inputValue.toLowerCase()) && 
      !tags.includes(p.tag)
    ).slice(0, 5),
    recent: recentTags.filter(tag => 
      tag.toLowerCase().includes(inputValue.toLowerCase()) && 
      !tags.includes(tag)
    ).slice(0, 5),
    generated: autoSuggestions.slice(0, 5),
    suggested: suggestions.filter(tag => 
      tag.toLowerCase().includes(inputValue.toLowerCase()) && 
      !tags.includes(tag)
    ).slice(0, 5)
  };

  return (
    <div className="space-y-4">
      {/* Current Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags</span>
            {tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {tags.length}
                {maxTags && `/${maxTags}`}
              </Badge>
            )}
          </div>
          {showStats && tags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTagsChange([])}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary"
              className={cn(
                'text-xs border',
                getTagColor(tag)
              )}
            >
              <Hash className="mr-1 h-3 w-3" />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <span className="text-sm text-muted-foreground italic">No tags added</span>
          )}
        </div>
      </div>

      {/* Tag Input */}
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={
              maxTags && tags.length >= maxTags 
                ? `Maximum ${maxTags} tags reached`
                : placeholder
            }
            disabled={!!(maxTags && tags.length >= maxTags)}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
        </div>

        {/* Dropdown with suggestions */}
        {showDropdown && showSuggestions && (
          <Card 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border"
          >
            <ScrollArea className="max-h-80">
              <div className="p-2">
                {/* Popular Tags */}
                {categorizedSuggestions.popular.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Popular</span>
                    </div>
                    <div className="space-y-1">
                      {categorizedSuggestions.popular.map((item, index) => (
                        <button
                          key={`popular-${item.tag}`}
                          onClick={() => addTag(item.tag)}
                          className={cn(
                            'w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted',
                            highlightedIndex === index && 'bg-muted'
                          )}
                        >
                          <span className="flex items-center">
                            <Hash className="mr-2 h-3 w-3 text-muted-foreground" />
                            {item.tag}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Tags */}
                {categorizedSuggestions.recent.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Recent</span>
                    </div>
                    <div className="space-y-1">
                      {categorizedSuggestions.recent.map((tag, index) => (
                        <button
                          key={`recent-${tag}`}
                          onClick={() => addTag(tag)}
                          className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-muted"
                        >
                          <Hash className="mr-2 h-3 w-3 text-muted-foreground" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Suggestions */}
                {categorizedSuggestions.generated.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>Suggested</span>
                    </div>
                    <div className="space-y-1">
                      {categorizedSuggestions.generated.map((tag, index) => (
                        <button
                          key={`generated-${tag}`}
                          onClick={() => addTag(tag)}
                          className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-muted"
                        >
                          <Hash className="mr-2 h-3 w-3 text-muted-foreground" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Suggestions */}
                {categorizedSuggestions.suggested.length > 0 && (
                  <div className="mb-3">
                    <div className="space-y-1">
                      {categorizedSuggestions.suggested.map((tag, index) => (
                        <button
                          key={`suggested-${tag}`}
                          onClick={() => addTag(tag)}
                          className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-muted"
                        >
                          <Hash className="mr-2 h-3 w-3 text-muted-foreground" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create new tag option */}
                {allowCreate && inputValue && !allSuggestions.includes(inputValue.toLowerCase()) && (
                  <>
                    <Separator className="my-2" />
                    <button
                      onClick={() => addTag(inputValue)}
                      className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-muted"
                    >
                      <Plus className="mr-2 h-3 w-3 text-muted-foreground" />
                      Create &quot;{sanitizeTag(inputValue)}&quot;
                    </button>
                  </>
                )}

                {/* No suggestions message */}
                {allSuggestions.length === 0 && !inputValue && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    Start typing to see suggestions
                  </div>
                )}

                {/* No results message */}
                {allSuggestions.length === 0 && inputValue && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No suggestions found
                    {allowCreate && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => addTag(inputValue)}
                        >
                          Create &quot;{sanitizeTag(inputValue)}&quot;
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* Helper text */}
      <div className="text-xs text-muted-foreground">
        {allowCreate && 'Press Enter, comma, or semicolon to add tags. '}
        Press Backspace to remove the last tag.
        {maxTags && ` Maximum ${maxTags} tags allowed.`}
      </div>
    </div>
  );
}