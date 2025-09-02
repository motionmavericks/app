'use client';

import React, { useState } from 'react';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { Collection, CollectionFolder } from '@/types/collection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Folder,
  FolderOpen,
  FolderOpen as CollectionIcon,
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Share,
  ChevronRight,
  ChevronDown,
  Star,
  Hash,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleDragOver, handleDrop, DropTarget, DraggedItem } from '@/lib/drag-drop';

interface CollectionSidebarProps {
  onCollectionSelect?: (collection: Collection) => void;
  onCreateCollection?: () => void;
  onAssetDropOnCollection?: (draggedItem: DraggedItem, dropTarget: DropTarget) => void;
  className?: string;
}

export function CollectionSidebar({
  onCollectionSelect,
  onCreateCollection,
  onAssetDropOnCollection,
  className
}: CollectionSidebarProps) {
  const {
    collections,
    folders,
    selectedCollectionId,
    selectedFolderId,
    sidebarExpanded,
    setSelectedCollectionId,
    setSelectedFolderId,
    setSidebarExpanded,
    deleteCollection,
    duplicateCollection,
    getCollectionsByFolder,
    searchCollections,
    toggleFolderExpanded,
  } = useCollectionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<{
    type: 'collection' | 'folder';
    id: string;
  } | null>(null);

  const filteredCollections = searchQuery
    ? searchCollections(searchQuery)
    : collections;

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollectionId(collection.id);
    setSelectedFolderId(null);
    onCollectionSelect?.(collection);
  };

  const handleFolderClick = (folder: CollectionFolder) => {
    setSelectedFolderId(folder.id);
    setSelectedCollectionId(null);
    toggleFolderExpanded(folder.id);
  };

  const handleDragStart = (
    e: React.DragEvent,
    type: 'collection' | 'folder',
    id: string
  ) => {
    setDraggedItem({ type, id });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCollectionDrop = (e: React.DragEvent, collection: Collection) => {
    e.preventDefault();
    e.stopPropagation();

    const dropTarget: DropTarget = {
      type: 'collection',
      id: collection.id,
      accepts: ['asset', 'assets'],
    };

    handleDrop(e, dropTarget, (draggedItem, dropTarget) => {
      onAssetDropOnCollection?.(draggedItem, dropTarget);
    });
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.type === 'collection') {
      // Move collection to folder
      // This would typically call an API
      console.log(`Moving collection ${draggedItem.id} to folder ${targetFolderId}`);
    }

    setDraggedItem(null);
  };

  const renderCollectionItem = (collection: Collection, level = 0) => (
    <div
      key={collection.id}
      draggable
      onDragStart={(e) => handleDragStart(e, 'collection', collection.id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleCollectionDrop(e, collection)}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'border-2 border-transparent',
        'data-[drag-over=true]:border-primary data-[drag-over=true]:bg-primary/10',
        selectedCollectionId === collection.id && 'bg-accent text-accent-foreground',
        level > 0 && 'ml-4'
      )}
      onClick={() => handleCollectionClick(collection)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {collection.type === 'smart' ? (
          <Hash className="h-4 w-4 text-blue-500 shrink-0" />
        ) : (
          <CollectionIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        
        <span className="truncate text-sm">{collection.name}</span>
        
        {collection.assetCount > 0 && (
          <Badge variant="secondary" className="h-5 text-xs shrink-0">
            {collection.assetCount}
          </Badge>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicateCollection(collection.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => deleteCollection(collection.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderFolderItem = (folder: CollectionFolder, level = 0) => {
    const folderCollections = getCollectionsByFolder(folder.id);
    const childFolders = folders.filter(f => f.parentId === folder.id);

    return (
      <Collapsible key={folder.id} open={folder.isExpanded}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleFolderDrop(e, folder.id)}
          className={cn(
            'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'border-2 border-transparent',
            'data-[drag-over=true]:border-primary data-[drag-over=true]:bg-primary/10',
            selectedFolderId === folder.id && 'bg-accent text-accent-foreground',
            level > 0 && 'ml-4'
          )}
        >
          <CollapsibleTrigger
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => handleFolderClick(folder)}
          >
            {folder.isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            
            {folder.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            
            <span className="truncate text-sm">{folder.name}</span>
            
            {folderCollections.length > 0 && (
              <Badge variant="secondary" className="h-5 text-xs shrink-0">
                {folderCollections.length}
              </Badge>
            )}
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                New Collection
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Folder className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          <div className="ml-4">
            {childFolders.map(child => renderFolderItem(child, level + 1))}
            {folderCollections.map(collection => renderCollectionItem(collection, level + 1))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const rootFolders = folders.filter(f => !f.parentId);
  const rootCollections = getCollectionsByFolder(undefined);

  if (!sidebarExpanded) {
    return (
      <div className={cn('w-12 border-r bg-background/95', className)}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarExpanded(true)}
            className="h-8 w-8 p-0"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-64 border-r bg-background/95 flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Collections</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateCollection}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarExpanded(false)}
              className="h-8 w-8 p-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      </div>

      {/* Collections List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Quick access collections */}
          <div className="mb-4">
            <div
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                !selectedCollectionId && !selectedFolderId && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                setSelectedCollectionId(null);
                setSelectedFolderId(null);
              }}
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">All Assets</span>
              <Badge variant="secondary" className="h-5 text-xs ml-auto">
                {collections.reduce((sum, c) => sum + c.assetCount, 0)}
              </Badge>
            </div>
          </div>

          {/* Folder structure */}
          {rootFolders.map(folder => renderFolderItem(folder))}
          
          {/* Root level collections */}
          {(searchQuery ? filteredCollections : rootCollections).map(collection =>
            renderCollectionItem(collection)
          )}

          {filteredCollections.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No collections found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}