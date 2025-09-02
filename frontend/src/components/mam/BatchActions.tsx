'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  Trash2, 
  Archive, 
  Tag, 
  Copy, 
  Move,
  Share2,
  Lock,
  Unlock,
  ChevronDown,
  X
} from 'lucide-react';

interface BatchActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
  onClearSelection: () => void;
}

export function BatchActions({ selectedCount, onAction, onClearSelection }: BatchActionsProps) {
  return (
    <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between animate-in slide-in-from-top">
      <div className="flex items-center gap-4">
        <span className="font-medium">{selectedCount} items selected</span>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAction('download')}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAction('addToCollection')}
        >
          <Copy className="mr-2 h-4 w-4" />
          Add to Collection
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              More Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onAction('tag')}>
              <Tag className="mr-2 h-4 w-4" />
              Add Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('move')}>
              <Move className="mr-2 h-4 w-4" />
              Move to Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('share')}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction('archive')}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('lock')}>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('unlock')}>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onAction('delete')}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="text-primary-foreground hover:bg-primary-foreground/20"
      >
        <X className="mr-2 h-4 w-4" />
        Clear Selection
      </Button>
    </div>
  );
}