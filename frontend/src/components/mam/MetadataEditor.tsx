'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save, RefreshCw } from 'lucide-react';

interface MetadataEditorProps {
  asset: Asset;
  onSave: (metadata: Partial<Asset>) => Promise<void>;
  onClose: () => void;
}

export function MetadataEditor({ asset, onSave, onClose }: MetadataEditorProps) {
  const [metadata, setMetadata] = useState<Partial<Asset>>({
    title: asset.title,
    description: asset.description,
    tags: asset.tags || [],
    status: asset.status,
    type: asset.type,
    copyright: asset.copyright,
    creator: asset.creator,
    location: asset.location,
    customFields: asset.customFields || {}
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(metadata);
      onClose();
    } catch (error) {
      console.error('Failed to save metadata:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput && !metadata.tags?.includes(tagInput)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const addCustomField = () => {
    if (customFieldKey && customFieldValue) {
      setMetadata(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [customFieldKey]: customFieldValue
        }
      }));
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  };

  const removeCustomField = (key: string) => {
    setMetadata(prev => {
      const fields = { ...prev.customFields };
      delete fields[key];
      return { ...prev, customFields: fields };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Edit Metadata</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Asset title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Asset description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={metadata.status}
                  onValueChange={(value) => setMetadata(prev => ({ ...prev, status: value as Asset['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={metadata.type}
                  onValueChange={(value) => setMetadata(prev => ({ ...prev, type: value as "video" | "image" | "audio" | "document" | "other" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tags</h3>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button onClick={addTag} variant="secondary">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.tags?.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Rights & Attribution */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rights & Attribution</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creator">Creator</Label>
                <Input
                  id="creator"
                  value={metadata.creator || ''}
                  onChange={(e) => setMetadata(prev => ({ ...prev, creator: e.target.value }))}
                  placeholder="Creator name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyright">Copyright</Label>
                <Input
                  id="copyright"
                  value={metadata.copyright || ''}
                  onChange={(e) => setMetadata(prev => ({ ...prev, copyright: e.target.value }))}
                  placeholder="Copyright information"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={metadata.location || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Location information"
              />
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Custom Fields</h3>
            <div className="flex gap-2">
              <Input
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
                placeholder="Field name"
              />
              <Input
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                placeholder="Field value"
              />
              <Button onClick={addCustomField} variant="secondary">Add</Button>
            </div>
            <div className="space-y-2">
              {Object.entries(metadata.customFields || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="font-medium">{key}:</span>
                  <span className="flex-1">{value}</span>
                  <button
                    onClick={() => removeCustomField(key)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Metadata (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Technical Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">File ID:</span> {asset.id}
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span> {asset.size ? `${(asset.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span> {new Date(asset.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">Modified:</span> {new Date(asset.updatedAt).toLocaleString()}
              </div>
              {asset.duration && (
                <div>
                  <span className="text-muted-foreground">Duration:</span> {asset.duration}
                </div>
              )}
              {asset.dimensions && (
                <div>
                  <span className="text-muted-foreground">Dimensions:</span> {asset.dimensions.width}x{asset.dimensions.height}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}