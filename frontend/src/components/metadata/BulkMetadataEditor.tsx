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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Save, 
  RefreshCw, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Tag,
  Settings,
  Zap,
  FileCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagManager } from './TagManager';
import { 
  CustomFieldDefinition, 
  MetadataValidator, 
  ValidationError,
  DUBLIN_CORE_FIELDS
} from '@/lib/metadata/validation';

interface BulkOperation {
  field: string;
  action: 'set' | 'append' | 'prepend' | 'remove' | 'clear';
  value: string | number | boolean | string[] | Record<string, unknown>;
  enabled: boolean;
}

interface BulkMetadataEditorProps {
  assets: Asset[];
  onSave: (operations: BulkOperation[], assetIds: string[]) => Promise<void>;
  onClose: () => void;
  customFields?: CustomFieldDefinition[];
}

export function BulkMetadataEditor({ 
  assets, 
  onSave, 
  onClose, 
  customFields = [] 
}: BulkMetadataEditorProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(assets.map(a => a.id))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('operations');

  // Available fields for bulk operations
  const availableFields = [
    { id: 'title', label: 'Title', type: 'text' },
    { id: 'description', label: 'Description', type: 'textarea' },
    { id: 'status', label: 'Status', type: 'select', options: ['draft', 'review', 'approved', 'published', 'archived'] },
    { id: 'type', label: 'Type', type: 'select', options: ['video', 'image', 'audio', 'document', 'other'] },
    { id: 'creator', label: 'Creator', type: 'text' },
    { id: 'copyright', label: 'Copyright', type: 'text' },
    { id: 'location', label: 'Location', type: 'text' },
    { id: 'tags', label: 'Tags', type: 'tags' },
    ...customFields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
      options: field.options
    }))
  ];

  const addOperation = (field: string) => {
    const fieldDef = availableFields.find(f => f.id === field);
    if (!fieldDef) return;

    const newOperation: BulkOperation = {
      field,
      action: fieldDef.type === 'tags' ? 'append' : 'set',
      value: getDefaultValue(fieldDef.type),
      enabled: true
    };

    setOperations(prev => [...prev, newOperation]);
  };

  const updateOperation = (index: number, updates: Partial<BulkOperation>) => {
    setOperations(prev => prev.map((op, i) => 
      i === index ? { ...op, ...updates } : op
    ));
  };

  const removeOperation = (index: number) => {
    setOperations(prev => prev.filter((_, i) => i !== index));
  };

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'tags':
        return [];
      case 'textarea':
        return '';
      case 'select':
        return '';
      case 'boolean':
        return false;
      case 'number':
        return 0;
      default:
        return '';
    }
  };

  const getActionLabel = (action: BulkOperation['action'], fieldType: string) => {
    switch (action) {
      case 'set':
        return 'Replace with';
      case 'append':
        return fieldType === 'tags' ? 'Add tags' : 'Append';
      case 'prepend':
        return 'Prepend';
      case 'remove':
        return fieldType === 'tags' ? 'Remove tags' : 'Remove';
      case 'clear':
        return 'Clear';
      default:
        return action;
    }
  };

  const getAvailableActions = (fieldType: string) => {
    const baseActions = [
      { value: 'set', label: 'Replace with' },
      { value: 'clear', label: 'Clear' }
    ];

    if (fieldType === 'tags') {
      return [
        ...baseActions,
        { value: 'append', label: 'Add tags' },
        { value: 'remove', label: 'Remove tags' }
      ];
    }

    if (fieldType === 'text' || fieldType === 'textarea') {
      return [
        ...baseActions,
        { value: 'append', label: 'Append' },
        { value: 'prepend', label: 'Prepend' }
      ];
    }

    return baseActions;
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const selectAllAssets = () => {
    setSelectedAssetIds(new Set(assets.map(a => a.id)));
  };

  const deselectAllAssets = () => {
    setSelectedAssetIds(new Set());
  };

  const handleSave = async () => {
    const enabledOperations = operations.filter(op => op.enabled);
    if (enabledOperations.length === 0 || selectedAssetIds.size === 0) {
      return;
    }

    setIsSaving(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onSave(enabledOperations, Array.from(selectedAssetIds));
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to save bulk metadata:', error);
      setIsSaving(false);
      setProgress(0);
    }
  };

  const renderOperationValue = (operation: BulkOperation, index: number) => {
    const field = availableFields.find(f => f.id === operation.field);
    if (!field) return null;

    if (operation.action === 'clear') {
      return <span className="text-sm text-muted-foreground italic">Field will be cleared</span>;
    }

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={typeof operation.value === 'string' ? operation.value : ''}
            onChange={(e) => updateOperation(index, { value: e.target.value })}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select
            value={typeof operation.value === 'string' ? operation.value : ''}
            onValueChange={(value) => updateOperation(index, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  <span className="capitalize">{option}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'tags':
        return (
          <TagManager
            tags={Array.isArray(operation.value) ? operation.value : []}
            onTagsChange={(newTags) => updateOperation(index, { value: newTags })}
            suggestions={[]}
            allowCreate={true}
            placeholder={operation.action === 'remove' ? 'Tags to remove' : 'Tags to add'}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!operation.value}
              onCheckedChange={(checked) => updateOperation(index, { value: checked })}
            />
            <Label>{operation.value ? 'Yes' : 'No'}</Label>
          </div>
        );

      default:
        return (
          <Input
            value={typeof operation.value === 'string' ? operation.value : ''}
            onChange={(e) => updateOperation(index, { value: e.target.value })}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  const getPreviewValue = (asset: Asset, operation: BulkOperation) => {
    const field = operation.field as keyof Asset;
    const currentValue = asset[field] || asset.customFields?.[operation.field];

    switch (operation.action) {
      case 'set':
        return operation.value;
      case 'clear':
        return field === 'tags' ? [] : '';
      case 'append':
        if (field === 'tags' && Array.isArray(currentValue)) {
          const existingTags = currentValue as string[];
          const newTags = Array.isArray(operation.value) ? operation.value : [];
          return [...existingTags, ...newTags.filter(tag => !existingTags.includes(tag))];
        }
        return `${currentValue || ''}${operation.value || ''}`;
      case 'prepend':
        return `${operation.value || ''}${currentValue || ''}`;
      case 'remove':
        if (field === 'tags' && Array.isArray(currentValue)) {
          const existingTags = currentValue as string[];
          const tagsToRemove = Array.isArray(operation.value) ? operation.value : [];
          return existingTags.filter(tag => !tagsToRemove.includes(tag));
        }
        return currentValue;
      default:
        return currentValue;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold flex items-center">
              <Users className="mr-2 h-6 w-6" />
              Bulk Metadata Editor
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Edit metadata for {selectedAssetIds.size} of {assets.length} assets
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isSaving && (
          <div className="px-6 py-3 bg-muted/50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Applying changes...</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="operations" className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Operations
                {operations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5">
                    {operations.filter(op => op.enabled).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center">
                <FileCheck className="mr-2 h-4 w-4" />
                Assets
                <Badge variant="secondary" className="ml-2 h-5">
                  {selectedAssetIds.size}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center">
                {previewMode ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="p-6">
              {/* Operations Tab */}
              <TabsContent value="operations" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Bulk Operations</CardTitle>
                        <Select onValueChange={addOperation}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Add operation..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields
                              .filter(field => !operations.some(op => op.field === field.id))
                              .map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {operations.length === 0 ? (
                        <div className="text-center py-8">
                          <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No operations defined</h3>
                          <p className="text-muted-foreground">Add operations to modify multiple assets at once.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {operations.map((operation, index) => {
                            const field = availableFields.find(f => f.id === operation.field);
                            if (!field) return null;

                            return (
                              <Card key={index} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={operation.enabled}
                                      onCheckedChange={(checked) => 
                                        updateOperation(index, { enabled: !!checked })
                                      }
                                    />
                                    <div>
                                      <h4 className="font-medium">{field.label}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {getActionLabel(operation.action, field.type)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Select
                                      value={operation.action}
                                      onValueChange={(action) => 
                                        updateOperation(index, { action: action as BulkOperation['action'] })
                                      }
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableActions(field.type).map((actionOption) => (
                                          <SelectItem key={actionOption.value} value={actionOption.value}>
                                            {actionOption.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeOperation(index)}
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className={cn(
                                  'mt-3',
                                  !operation.enabled && 'opacity-50 pointer-events-none'
                                )}>
                                  {renderOperationValue(operation, index)}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Target Assets</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllAssets}
                          disabled={selectedAssetIds.size === assets.length}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllAssets}
                          disabled={selectedAssetIds.size === 0}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className={cn(
                            'flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50',
                            selectedAssetIds.has(asset.id) && 'bg-muted border-primary'
                          )}
                          onClick={() => toggleAssetSelection(asset.id)}
                        >
                          <Checkbox
                            checked={selectedAssetIds.has(asset.id)}
                            onCheckedChange={() => toggleAssetSelection(asset.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{asset.title}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {asset.type}
                              </Badge>
                              <Badge variant={asset.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                                {asset.status}
                              </Badge>
                              {asset.tags && asset.tags.length > 0 && (
                                <span>{asset.tags.length} tags</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Changes Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {operations.filter(op => op.enabled).length === 0 || selectedAssetIds.size === 0 ? (
                      <div className="text-center py-8">
                        <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No changes to preview</h3>
                        <p className="text-muted-foreground">
                          Add operations and select assets to see a preview of changes.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Array.from(selectedAssetIds).slice(0, 5).map((assetId) => {
                          const asset = assets.find(a => a.id === assetId);
                          if (!asset) return null;

                          return (
                            <Card key={assetId} className="p-4">
                              <h4 className="font-medium mb-3">{asset.title}</h4>
                              <div className="space-y-3">
                                {operations.filter(op => op.enabled).map((operation, opIndex) => {
                                  const field = availableFields.find(f => f.id === operation.field);
                                  if (!field) return null;

                                  const currentValue = operation.field in asset 
                                    ? asset[operation.field as keyof Asset]
                                    : asset.customFields?.[operation.field];
                                  const newValue = getPreviewValue(asset, operation);

                                  return (
                                    <div key={opIndex} className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-muted-foreground">
                                        {field.label}:
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground">
                                          {Array.isArray(currentValue) 
                                            ? currentValue.join(', ') || 'None'
                                            : (typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue)) || 'None'
                                          }
                                        </span>
                                        <span>→</span>
                                        <span className="font-medium">
                                          {Array.isArray(newValue) 
                                            ? newValue.join(', ') || 'None'
                                            : (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) || 'None'
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </Card>
                          );
                        })}
                        
                        {selectedAssetIds.size > 5 && (
                          <div className="text-center text-sm text-muted-foreground">
                            ... and {selectedAssetIds.size - 5} more assets
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between p-6 border-t bg-muted/20">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{operations.filter(op => op.enabled).length} operations</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{selectedAssetIds.size} assets selected</span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={
                isSaving || 
                operations.filter(op => op.enabled).length === 0 || 
                selectedAssetIds.size === 0
              }
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Apply to {selectedAssetIds.size} Assets
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}