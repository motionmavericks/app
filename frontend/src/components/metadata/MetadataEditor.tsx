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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  X, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle,
  Info,
  Tag,
  Settings,
  FileType,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TagManager } from './TagManager';
import { 
  CustomFieldDefinition, 
  MetadataValidator, 
  ValidationError, 
  DUBLIN_CORE_FIELDS,
  createDublinCoreSchema
} from '@/lib/metadata/validation';

interface MetadataEditorProps {
  asset: Asset;
  onSave: (metadata: Partial<Asset>) => Promise<void>;
  onClose: () => void;
  customFields?: CustomFieldDefinition[];
  validationSchema?: string;
}

export function MetadataEditor({ 
  asset, 
  onSave, 
  onClose, 
  customFields = [], 
  validationSchema = 'none' 
}: MetadataEditorProps) {
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
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false);
  const [newCustomField, setNewCustomField] = useState<Partial<CustomFieldDefinition>>({
    type: 'text',
    required: false
  });

  // Combined fields from schema and custom
  const allCustomFields = [...DUBLIN_CORE_FIELDS, ...customFields];
  
  // Initialize validator
  const validator = new MetadataValidator(
    validationSchema === 'dublin-core' ? createDublinCoreSchema() : undefined
  );

  const validateMetadata = (data: Partial<Asset>) => {
    const validationData: Record<string, string | number | boolean | string[]> = {
      ...(data.customFields || {})
    };
    
    // Add safe field conversions
    if (data.title) validationData.title = data.title;
    if (data.description) validationData.description = data.description;
    if (data.creator) validationData.creator = data.creator;
    if (data.copyright) validationData.copyright = data.copyright;
    if (data.location) validationData.location = data.location;
    if (data.tags) validationData.tags = data.tags;
    
    const validationErrors = validator.validate(validationData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleFieldChange = (field: keyof Asset, value: string | string[]) => {
    const newMetadata = { ...metadata, [field]: value };
    setMetadata(newMetadata);
    setIsDirty(true);
    
    // Debounced validation
    setTimeout(() => validateMetadata(newMetadata), 300);
  };

  const handleCustomFieldChange = (fieldId: string, value: string | number | boolean | string[]) => {
    const newCustomFields = { ...metadata.customFields, [fieldId]: value };
    const newMetadata = { ...metadata, customFields: newCustomFields };
    setMetadata(newMetadata);
    setIsDirty(true);
    
    setTimeout(() => validateMetadata(newMetadata), 300);
  };

  const removeCustomField = (fieldId: string) => {
    const newCustomFields = { ...metadata.customFields };
    delete newCustomFields[fieldId];
    const newMetadata = { ...metadata, customFields: newCustomFields };
    setMetadata(newMetadata);
    setIsDirty(true);
  };

  const addCustomField = () => {
    if (!newCustomField.name || !newCustomField.id) return;
    
    const fieldValue = getDefaultValue(newCustomField.type || 'text');
    const newCustomFields = { ...metadata.customFields, [newCustomField.id]: fieldValue };
    const newMetadata = { ...metadata, customFields: newCustomFields };
    setMetadata(newMetadata);
    setIsDirty(true);
    
    // Reset form
    setNewCustomField({ type: 'text', required: false });
    setShowCustomFieldDialog(false);
  };

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'multiselect':
        return [];
      default:
        return '';
    }
  };

  const handleSave = async () => {
    if (!validateMetadata(metadata)) {
      setActiveTab('basic');
      return;
    }

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

  const handleTagsChange = (newTags: string[]) => {
    handleFieldChange('tags', newTags);
  };

  const renderCustomField = (field: CustomFieldDefinition, value: string | number | boolean | string[] | undefined) => {
    const hasError = errors.some(error => error.field === field.name || error.field === field.id);
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(hasError && 'border-destructive')}
            rows={3}
          />
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={typeof value === 'number' ? String(value) : ''}
            onChange={(e) => handleCustomFieldChange(field.id, Number(e.target.value))}
            placeholder={field.placeholder}
            className={cn(hasError && 'border-destructive')}
          />
        );
        
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground',
                  hasError && 'border-destructive'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {typeof value === 'string' && value ? format(new Date(value), 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={typeof value === 'string' ? new Date(value) : undefined}
                onSelect={(date) => handleCustomFieldChange(field.id, date?.toISOString().split('T')[0] || '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => handleCustomFieldChange(field.id, checked)}
            />
            <Label>{value ? 'Yes' : 'No'}</Label>
          </div>
        );
        
      case 'select':
        return (
          <Select
            value={typeof value === 'string' ? value : ''}
            onValueChange={(newValue) => handleCustomFieldChange(field.id, newValue)}
          >
            <SelectTrigger className={cn(hasError && 'border-destructive')}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'multiselect':
        const selectedOptions = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option: string) => (
                <Badge key={option} variant="secondary">
                  {option}
                  <button
                    onClick={() => {
                      const newOptions = selectedOptions.filter(o => o !== option);
                      handleCustomFieldChange(field.id, newOptions);
                    }}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              onValueChange={(newValue) => {
                if (!selectedOptions.includes(newValue)) {
                  handleCustomFieldChange(field.id, [...selectedOptions, newValue]);
                }
              }}
            >
              <SelectTrigger className={cn(hasError && 'border-destructive')}>
                <SelectValue placeholder="Add option..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.filter(option => !selectedOptions.includes(option)).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      default:
        return (
          <Input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(hasError && 'border-destructive')}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Edit Metadata</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {asset.title} • {isDirty && 'Unsaved changes'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {errors.length > 0 && (
              <div className="flex items-center text-destructive text-sm">
                <AlertTriangle className="mr-1 h-4 w-4" />
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="basic" className="flex items-center">
                <Info className="mr-2 h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="rights" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Rights
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Custom Fields
                {Object.keys(metadata.customFields || {}).length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5">
                    {Object.keys(metadata.customFields || {}).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center">
                <FileType className="mr-2 h-4 w-4" />
                Technical
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="p-6">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={metadata.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        placeholder="Asset title"
                        className={cn(errors.some(e => e.field === 'title') && 'border-destructive')}
                      />
                      {errors.find(e => e.field === 'title') && (
                        <p className="text-sm text-destructive flex items-center">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {errors.find(e => e.field === 'title')?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={metadata.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Asset description"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={metadata.status}
                          onValueChange={(value) => handleFieldChange('status', value)}
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
                          onValueChange={(value) => handleFieldChange('type', value)}
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

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={metadata.location || ''}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        placeholder="Location information"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tags Tab */}
              <TabsContent value="tags" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Tags Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TagManager
                      tags={metadata.tags || []}
                      onTagsChange={handleTagsChange}
                      suggestions={[]}
                      allowCreate={true}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rights & Attribution Tab */}
              <TabsContent value="rights" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Rights & Attribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="creator">Creator</Label>
                        <Input
                          id="creator"
                          value={metadata.creator || ''}
                          onChange={(e) => handleFieldChange('creator', e.target.value)}
                          placeholder="Creator name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="copyright">Copyright</Label>
                        <Input
                          id="copyright"
                          value={metadata.copyright || ''}
                          onChange={(e) => handleFieldChange('copyright', e.target.value)}
                          placeholder="Copyright information"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Custom Fields Tab */}
              <TabsContent value="custom" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Custom Fields
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomFieldDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allCustomFields.length > 0 ? (
                      <div className="space-y-6">
                        {allCustomFields.map((field) => {
                          const value = metadata.customFields?.[field.id];
                          const fieldErrors = errors.filter(e => e.field === field.name || e.field === field.id);
                          
                          return (
                            <div key={field.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={field.id}>
                                  {field.label}
                                  {field.required && <span className="text-destructive">*</span>}
                                </Label>
                                {!DUBLIN_CORE_FIELDS.find(f => f.id === field.id) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCustomField(field.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {field.description && (
                                <p className="text-xs text-muted-foreground">{field.description}</p>
                              )}
                              {renderCustomField(field, value)}
                              {fieldErrors.length > 0 && (
                                <div className="space-y-1">
                                  {fieldErrors.map((error, index) => (
                                    <p key={index} className="text-sm text-destructive flex items-center">
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                      {error.message}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No custom fields</h3>
                        <p className="text-muted-foreground">Add custom fields to capture additional metadata.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Technical Information Tab */}
              <TabsContent value="technical" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">File ID:</span> 
                        <code className="ml-2 bg-muted px-2 py-1 rounded">{asset.id}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span> 
                        {asset.size ? ` ${(asset.size / 1024 / 1024).toFixed(2)} MB` : ' Unknown'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span> 
                        {format(new Date(asset.createdAt), 'PPpp')}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modified:</span> 
                        {format(new Date(asset.updatedAt), 'PPpp')}
                      </div>
                      {asset.duration && (
                        <div>
                          <span className="text-muted-foreground">Duration:</span> {asset.duration}
                        </div>
                      )}
                      {asset.dimensions && (
                        <div>
                          <span className="text-muted-foreground">Dimensions:</span> 
                          {` ${asset.dimensions.width}×${asset.dimensions.height}`}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between p-6 border-t bg-muted/20">
          <div className="flex items-center space-x-2">
            {errors.length === 0 && isDirty && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="mr-1 h-4 w-4" />
                Ready to save
              </div>
            )}
            {validationSchema === 'dublin-core' && (
              <Badge variant="outline">Dublin Core Compliant</Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || errors.length > 0}
            >
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

      {/* Custom Field Dialog */}
      {showCustomFieldDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Custom Field</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input
                    value={newCustomField.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewCustomField(prev => ({ 
                        ...prev, 
                        name,
                        id: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                      }));
                    }}
                    placeholder="Enter field name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select
                    value={newCustomField.type}
                    onValueChange={(value) => setNewCustomField(prev => ({ ...prev, type: value as CustomFieldDefinition['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Long Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="multiselect">Multiple Select</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newCustomField.required}
                    onCheckedChange={(checked) => setNewCustomField(prev => ({ ...prev, required: checked }))}
                  />
                  <Label>Required field</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCustomFieldDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addCustomField}
                  disabled={!newCustomField.name}
                >
                  Add Field
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}