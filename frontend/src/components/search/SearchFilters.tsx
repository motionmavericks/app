'use client';

import React, { useState } from 'react';
import {
  Filter,
  X,
  Calendar,
  FileType,
  Tag,
  User,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearchStore } from '@/lib/stores/search-store';
import { formatFileSize, formatDateRange } from '@/lib/search';
import { Asset } from '@/types/asset';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  assets: Asset[];
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

function FilterSection({
  title,
  icon,
  children,
  isCollapsible = true,
  defaultExpanded = true
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-between p-2 h-auto font-medium"
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {isCollapsible && (
          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      
      {(!isCollapsible || isExpanded) && (
        <div className="pl-6 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function SearchFilters({ assets, className }: SearchFiltersProps) {
  const {
    filters,
    getActiveFiltersCount,
    updateFilter,
    clearFilters,
    showFilters,
    toggleFilters
  } = useSearchStore();

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filters.dateRange?.from,
    to: filters.dateRange?.to
  });

  const [sizeRange, setSizeRange] = useState([
    filters.sizeRange?.min || 0,
    filters.sizeRange?.max || 1000000000 // 1GB default max
  ]);

  // Get unique filter options from assets
  const filterOptions = React.useMemo(() => {
    const types = [...new Set(assets.map(asset => asset.type))].sort();
    const statuses = [...new Set(assets.map(asset => asset.status))].sort();
    const tags = [...new Set(assets.flatMap(asset => asset.tags || []))].sort();
    const creators = [...new Set(assets.map(asset => asset.creator).filter(Boolean))].sort();
    const collections = [...new Set(assets.flatMap(asset => asset.collections || []))].sort();
    
    // Get size range
    const sizes = assets.map(asset => asset.size || 0).filter(size => size > 0);
    const minSize = Math.min(...sizes, 0);
    const maxSize = Math.max(...sizes, 1000000000);

    return {
      types,
      statuses,
      tags,
      creators,
      collections,
      sizeRange: { min: minSize, max: maxSize }
    };
  }, [assets]);

  // Handle checkbox changes
  const handleCheckboxChange = (
    filterKey: keyof typeof filters,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[filterKey] as string[] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    updateFilter(filterKey, newValues);
  };


  // Handle size range changes
  const handleSizeRangeChange = (values: number[]) => {
    setSizeRange(values);
    updateFilter('sizeRange', { min: values[0], max: values[1] });
  };

  // Remove specific filter
  const removeFilter = (filterKey: keyof typeof filters, value?: string) => {
    if (value && Array.isArray(filters[filterKey])) {
      const currentValues = filters[filterKey] as string[];
      updateFilter(filterKey, currentValues.filter(v => v !== value));
    } else {
      updateFilter(filterKey, filterKey === 'type' || filterKey === 'status' || filterKey === 'tags' || filterKey === 'creator' || filterKey === 'collections' ? [] : undefined);
    }
  };

  const activeFiltersCount = getActiveFiltersCount();

  if (!showFilters) {
    return (
      <Button
        variant="outline"
        onClick={toggleFilters}
        className={cn("flex items-center gap-2", className)}
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <>
                <Badge variant="secondary">{activeFiltersCount}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Active Filters</h4>
                <div className="flex flex-wrap gap-1">
                  {filters.type?.map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      Type: {type}
                      <button
                        onClick={() => removeFilter('type', type)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.status?.map(status => (
                    <Badge key={status} variant="secondary" className="text-xs">
                      Status: {status}
                      <button
                        onClick={() => removeFilter('status', status)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      Tag: {tag}
                      <button
                        onClick={() => removeFilter('tags', tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.creator?.map(creator => (
                    <Badge key={creator} variant="secondary" className="text-xs">
                      Creator: {creator}
                      <button
                        onClick={() => removeFilter('creator', creator)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.collections?.map(collection => (
                    <Badge key={collection} variant="secondary" className="text-xs">
                      Collection: {collection}
                      <button
                        onClick={() => removeFilter('collections', collection)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.dateRange && (
                    <Badge variant="secondary" className="text-xs">
                      Date: {formatDateRange(filters.dateRange.from, filters.dateRange.to)}
                      <button
                        onClick={() => removeFilter('dateRange')}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.sizeRange && (
                    <Badge variant="secondary" className="text-xs">
                      Size: {formatFileSize(filters.sizeRange.min)} - {formatFileSize(filters.sizeRange.max)}
                      <button
                        onClick={() => removeFilter('sizeRange')}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
                <Separator />
              </div>
            )}

            {/* Asset Type Filter */}
            <FilterSection
              title="Asset Type"
              icon={<FileType className="h-4 w-4" />}
            >
              <div className="space-y-2">
                {filterOptions.types.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.type?.includes(type) || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('type', type, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </FilterSection>

            <Separator />

            {/* Status Filter */}
            <FilterSection
              title="Status"
              icon={<div className="h-4 w-4 rounded-full bg-primary" />}
            >
              <div className="space-y-2">
                {filterOptions.statuses.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status?.includes(status) || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('status', status, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                    >
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </FilterSection>

            <Separator />

            {/* Tags Filter */}
            {filterOptions.tags.length > 0 && (
              <>
                <FilterSection
                  title="Tags"
                  icon={<Tag className="h-4 w-4" />}
                >
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {filterOptions.tags.map(tag => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={filters.tags?.includes(tag) || false}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange('tags', tag, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`tag-${tag}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </FilterSection>
                <Separator />
              </>
            )}

            {/* Creator Filter */}
            {filterOptions.creators.length > 0 && (
              <>
                <FilterSection
                  title="Creator"
                  icon={<User className="h-4 w-4" />}
                >
                  <div className="space-y-2">
                    {filterOptions.creators.map(creator => (
                      <div key={creator} className="flex items-center space-x-2">
                        <Checkbox
                          id={`creator-${creator}`}
                          checked={filters.creator?.includes(creator as string) || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange('creator', creator as string, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`creator-${creator}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {creator}
                        </label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
                <Separator />
              </>
            )}

            {/* Collections Filter */}
            {filterOptions.collections.length > 0 && (
              <>
                <FilterSection
                  title="Collections"
                  icon={<FolderOpen className="h-4 w-4" />}
                >
                  <div className="space-y-2">
                    {filterOptions.collections.map(collection => (
                      <div key={collection} className="flex items-center space-x-2">
                        <Checkbox
                          id={`collection-${collection}`}
                          checked={filters.collections?.includes(collection) || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange('collections', collection, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`collection-${collection}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {collection}
                        </label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
                <Separator />
              </>
            )}

            {/* Date Range Filter */}
            <FilterSection
              title="Date Range"
              icon={<Calendar className="h-4 w-4" />}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateRange
                      ? formatDateRange(filters.dateRange.from, filters.dateRange.to)
                      : 'Select date range'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      if (range?.from && range?.to) {
                        updateFilter('dateRange', { from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </FilterSection>

            <Separator />

            {/* File Size Filter */}
            <FilterSection
              title="File Size"
              icon={<HardDrive className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatFileSize(sizeRange[0])}</span>
                    <span>{formatFileSize(sizeRange[1])}</span>
                  </div>
                  <Slider
                    value={sizeRange}
                    onValueChange={handleSizeRangeChange}
                    min={filterOptions.sizeRange.min}
                    max={filterOptions.sizeRange.max}
                    step={1000000} // 1MB steps
                    className="w-full"
                  />
                </div>
              </div>
            </FilterSection>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}