'use client';

import { Asset } from '@/types/asset';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  FileVideo, 
  FileImage, 
  FileAudio, 
  FileText, 
  File,
  Play,
  Download,
  Edit,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { highlightSearchTerms } from '@/lib/search';
import { handleAssetDragStart } from '@/lib/drag-drop';

interface AssetCardProps {
  asset: Asset;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  searchQuery?: string;
  onSelect: () => void;
  onToggleSelection: () => void;
  selectedAssets?: Asset[];
  onDragStart?: (asset: Asset | Asset[], isMultiple: boolean) => void;
}

export function AssetCard({ 
  asset, 
  viewMode, 
  isSelected, 
  searchQuery = '',
  onSelect, 
  onToggleSelection,
  selectedAssets = [],
  onDragStart
}: AssetCardProps) {
  const getTypeIcon = () => {
    switch (asset.type) {
      case 'video': return <FileVideo className="h-6 w-6" />;
      case 'image': return <FileImage className="h-6 w-6" />;
      case 'audio': return <FileAudio className="h-6 w-6" />;
      case 'document': return <FileText className="h-6 w-6" />;
      default: return <File className="h-6 w-6" />;
    }
  };

  const getStatusColor = () => {
    switch (asset.status) {
      case 'draft': return 'bg-gray-500';
      case 'review': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'published': return 'bg-green-500';
      case 'archived': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery) return text;
    const highlightedText = highlightSearchTerms(text, searchQuery);
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // If this asset is selected and there are multiple selected, drag all
    const shouldDragMultiple = isSelected && selectedAssets.length > 1;
    const dragData = shouldDragMultiple ? selectedAssets : asset;
    
    handleAssetDragStart(e, dragData, shouldDragMultiple);
    onDragStart?.(dragData, shouldDragMultiple);
  };

  const dragProps = {
    draggable: true,
    onDragStart: handleDragStart,
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
        {...dragProps}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-shrink-0">{getTypeIcon()}</div>
        
        <div className="flex-1 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{renderHighlightedText(asset.title)}</h3>
            <Badge className={`${getStatusColor()} text-white`}>
              {asset.status}
            </Badge>
          </div>
          {asset.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {renderHighlightedText(asset.description)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatFileSize(asset.size)}</span>
          {asset.duration && <span>{asset.duration}</span>}
          <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSelect}>
              <Play className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Metadata
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div 
      className="relative group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card cursor-grab active:cursor-grabbing"
      {...dragProps}
    >
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
          className="bg-background/80 backdrop-blur"
        />
      </div>

      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSelect}>
              <Play className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Metadata
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div 
        className="aspect-video bg-muted flex items-center justify-center cursor-pointer"
        onClick={onSelect}
      >
        {asset.thumbnailUrl ? (
          <img 
            src={asset.thumbnailUrl} 
            alt={asset.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground">{getTypeIcon()}</div>
        )}
        
        {asset.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded-full p-3">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium line-clamp-1">{renderHighlightedText(asset.title)}</h3>
          <Badge className={`${getStatusColor()} text-white text-xs`}>
            {asset.status}
          </Badge>
        </div>
        
        {asset.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {renderHighlightedText(asset.description)}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(asset.size)}</span>
          {asset.duration && <span>{asset.duration}</span>}
        </div>

        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}