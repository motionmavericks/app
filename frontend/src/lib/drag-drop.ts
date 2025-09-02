import { Asset } from '@/types/asset';
import { Collection } from '@/types/collection';

export interface DragDropContextType {
  isDragging: boolean;
  draggedItem: DraggedItem | null;
  dropTarget: DropTarget | null;
  setDraggedItem: (item: DraggedItem | null) => void;
  setDropTarget: (target: DropTarget | null) => void;
  setIsDragging: (dragging: boolean) => void;
}

export interface DraggedItem {
  type: 'asset' | 'collection' | 'assets';
  id: string;
  ids?: string[]; // For multiple assets
  data: Asset | Asset[] | Collection;
}

export interface DropTarget {
  type: 'collection' | 'folder' | 'browser';
  id: string;
  accepts: ('asset' | 'assets' | 'collection')[];
}

export const DRAG_TYPES = {
  ASSET: 'application/x-mam-asset',
  ASSETS: 'application/x-mam-assets',
  COLLECTION: 'application/x-mam-collection',
} as const;

export const createDragData = (item: DraggedItem): string => {
  return JSON.stringify(item);
};

export const parseDragData = (dataTransfer: DataTransfer): DraggedItem | null => {
  try {
    // Try to get data from different MIME types
    const data = dataTransfer.getData(DRAG_TYPES.ASSETS) || 
               dataTransfer.getData(DRAG_TYPES.ASSET) || 
               dataTransfer.getData(DRAG_TYPES.COLLECTION) ||
               dataTransfer.getData('text/plain');

    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse drag data:', error);
    return null;
  }
};

export const canDrop = (draggedItem: DraggedItem, dropTarget: DropTarget): boolean => {
  if (!draggedItem || !dropTarget) return false;

  // Check if drop target accepts this type of item
  const itemType = draggedItem.type === 'assets' ? 'assets' : draggedItem.type;
  if (!dropTarget.accepts.includes(itemType as 'asset' | 'assets' | 'collection')) {
    return false;
  }

  // Prevent dropping on self
  if (draggedItem.type === 'collection' && dropTarget.type === 'collection' && draggedItem.id === dropTarget.id) {
    return false;
  }

  return true;
};

export const handleAssetDragStart = (
  e: React.DragEvent,
  asset: Asset | Asset[],
  isMultiple = false
) => {
  const draggedItem: DraggedItem = isMultiple && Array.isArray(asset) ? {
    type: 'assets',
    id: 'multiple',
    ids: asset.map(a => a.id),
    data: asset,
  } : {
    type: 'asset',
    id: Array.isArray(asset) ? asset[0].id : asset.id,
    data: Array.isArray(asset) ? asset[0] : asset,
  };

  const dragData = createDragData(draggedItem);
  
  // Set data for different MIME types for maximum compatibility
  e.dataTransfer.setData(isMultiple ? DRAG_TYPES.ASSETS : DRAG_TYPES.ASSET, dragData);
  e.dataTransfer.setData('text/plain', dragData);
  e.dataTransfer.effectAllowed = 'copy';

  // Create drag image if needed
  if (isMultiple && Array.isArray(asset)) {
    const dragImage = createMultiAssetDragImage(asset.length);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
  }
};

export const handleCollectionDragStart = (
  e: React.DragEvent,
  collection: Collection
) => {
  const draggedItem: DraggedItem = {
    type: 'collection',
    id: collection.id,
    data: collection,
  };

  const dragData = createDragData(draggedItem);
  e.dataTransfer.setData(DRAG_TYPES.COLLECTION, dragData);
  e.dataTransfer.setData('text/plain', dragData);
  e.dataTransfer.effectAllowed = 'move';
};

export const handleDragOver = (e: React.DragEvent, dropTarget?: DropTarget) => {
  e.preventDefault();
  
  if (dropTarget) {
    const draggedItem = parseDragData(e.dataTransfer);
    if (draggedItem && canDrop(draggedItem, dropTarget)) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  } else {
    e.dataTransfer.dropEffect = 'none';
  }
};

export const handleDrop = (
  e: React.DragEvent,
  dropTarget: DropTarget,
  onDrop: (draggedItem: DraggedItem, dropTarget: DropTarget) => void
) => {
  e.preventDefault();
  
  const draggedItem = parseDragData(e.dataTransfer);
  if (!draggedItem) return;

  if (canDrop(draggedItem, dropTarget)) {
    onDrop(draggedItem, dropTarget);
  }
};

const createMultiAssetDragImage = (count: number): HTMLElement => {
  const dragImage = document.createElement('div');
  dragImage.style.position = 'absolute';
  dragImage.style.top = '-1000px';
  dragImage.style.left = '-1000px';
  dragImage.style.padding = '8px 12px';
  dragImage.style.backgroundColor = '#1f2937';
  dragImage.style.color = '#ffffff';
  dragImage.style.borderRadius = '8px';
  dragImage.style.fontSize = '14px';
  dragImage.style.fontWeight = '500';
  dragImage.style.zIndex = '9999';
  dragImage.textContent = `${count} assets`;
  
  document.body.appendChild(dragImage);
  
  // Clean up after a short delay
  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 100);
  
  return dragImage;
};

// Enhanced asset card component with drag support
export const enhanceAssetCardWithDrag = (
  asset: Asset,
  isSelected: boolean,
  selectedAssets: Asset[],
  onDragStart?: (asset: Asset | Asset[], isMultiple: boolean) => void
) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // If this asset is selected and there are multiple selected, drag all
    const shouldDragMultiple = isSelected && selectedAssets.length > 1;
    const dragData = shouldDragMultiple ? selectedAssets : asset;
    
    handleAssetDragStart(e, dragData, shouldDragMultiple);
    onDragStart?.(dragData, shouldDragMultiple);
  };

  return {
    draggable: true,
    onDragStart: handleDragStart,
    className: 'cursor-grab active:cursor-grabbing',
  };
};