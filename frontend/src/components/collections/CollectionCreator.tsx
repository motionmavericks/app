'use client';

import React, { useState } from 'react';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { Collection, SmartCollectionRule } from '@/types/collection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartCollectionBuilder } from './SmartCollectionBuilder';
import {
  FolderOpen as CollectionIcon,
  Hash,
  Palette,
  Users,
  Settings,
} from 'lucide-react';

interface CollectionCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCollection?: Collection | null;
  defaultFolderId?: string;
}

const COLLECTION_COLORS = [
  'blue', 'red', 'green', 'yellow', 'purple', 'pink', 'orange', 'gray'
];

export function CollectionCreator({
  open,
  onOpenChange,
  editCollection,
  defaultFolderId
}: CollectionCreatorProps) {
  const { createCollection, updateCollection, folders } = useCollectionStore();
  
  const [formData, setFormData] = useState({
    name: editCollection?.name || '',
    description: editCollection?.description || '',
    type: editCollection?.type || 'manual' as 'manual' | 'smart',
    parentId: editCollection?.parentId || defaultFolderId || '',
    isPublic: editCollection?.isPublic || false,
    color: editCollection?.color || 'blue',
    tags: editCollection?.tags?.join(', ') || '',
    smartRules: editCollection?.smartRules || [] as SmartCollectionRule[],
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean | SmartCollectionRule[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const collectionData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        parentId: formData.parentId || undefined,
        isPublic: formData.isPublic,
        color: formData.color,
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : undefined,
        smartRules: formData.type === 'smart' ? formData.smartRules : undefined,
        assetIds: [],
        assetCount: 0,
        createdBy: 'current-user', // This would come from auth context
      };

      if (editCollection) {
        updateCollection(editCollection.id, collectionData);
      } else {
        createCollection(collectionData);
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save collection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'manual',
      parentId: defaultFolderId || '',
      isPublic: false,
      color: 'blue',
      tags: '',
      smartRules: [],
    });
    setActiveTab('basic');
  };

  const handleClose = () => {
    onOpenChange(false);
    if (!editCollection) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.type === 'smart' ? (
              <Hash className="h-5 w-5 text-blue-500" />
            ) : (
              <CollectionIcon className="h-5 w-5" />
            )}
            {editCollection ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
          <DialogDescription>
            {editCollection 
              ? 'Update your collection settings and rules.'
              : 'Create a new collection to organize your assets.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">
              <Settings className="h-4 w-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="smart" disabled={formData.type === 'manual'}>
              <Hash className="h-4 w-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Style
            </TabsTrigger>
            <TabsTrigger value="sharing">
              <Users className="h-4 w-4 mr-2" />
              Sharing
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="basic" className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter collection name..."
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your collection..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Type */}
              <div>
                <Label>Collection Type</Label>
                <div className="mt-2 space-y-3">
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'manual'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => handleInputChange('type', 'manual')}
                  >
                    <div className="flex items-center gap-2">
                      <CollectionIcon className="h-4 w-4" />
                      <span className="font-medium">Manual Collection</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manually add and remove assets
                    </p>
                  </div>

                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'smart'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => handleInputChange('type', 'smart')}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Smart Collection</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatically populated based on rules
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Folder */}
              <div>
                <Label htmlFor="folder">Folder</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => handleInputChange('parentId', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a folder (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No folder</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas..."
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple tags with commas
                </p>
              </div>
            </TabsContent>

            <TabsContent value="smart" className="space-y-4">
              <SmartCollectionBuilder
                rules={formData.smartRules}
                onRulesChange={(rules) => handleInputChange('smartRules', rules)}
              />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              {/* Color */}
              <div>
                <Label>Collection Color</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLLECTION_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: {
                          blue: '#3b82f6',
                          red: '#ef4444',
                          green: '#10b981',
                          yellow: '#f59e0b',
                          purple: '#8b5cf6',
                          pink: '#ec4899',
                          orange: '#f97316',
                          gray: '#6b7280',
                        }[color]
                      }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sharing" className="space-y-4">
              {/* Public Access */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Public Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other users to view this collection
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
              </div>

              {formData.isPublic && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This collection will be visible to all users in your organization.
                    You can manage specific permissions after creating the collection.
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editCollection ? 'Update Collection' : 'Create Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}