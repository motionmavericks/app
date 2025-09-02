'use client';

import { useState } from 'react';
import { Asset } from '@/types/asset';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Edit3, 
  Copy, 
  ExternalLink, 
  Calendar, 
  User, 
  FileType, 
  HardDrive, 
  Clock,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  Tag,
  MapPin,
  Copyright,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface MetadataViewerProps {
  asset: Asset;
  onEdit?: () => void;
  readonly?: boolean;
}

export function MetadataViewer({ asset, onEdit, readonly = false }: MetadataViewerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Archive className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const CopyableField = ({ label, value, fieldKey }: { 
    label: string; 
    value: string | number | boolean | string[]; 
    fieldKey: string 
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-muted-foreground mb-1">{label}</dt>
        <dd className="text-sm text-foreground break-words">
          {Array.isArray(value) 
            ? value.join(', ') 
            : (typeof value === 'object' ? JSON.stringify(value) : String(value)) || 'Not specified'}
        </dd>
      </div>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-6 w-6 p-0 shrink-0"
          onClick={() => copyToClipboard(String(value), fieldKey)}
        >
          {copiedField === fieldKey ? (
            <span className="text-xs text-green-600">✓</span>
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{asset.title}</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {getAssetIcon(asset.type)}
            <span className="capitalize">{asset.type}</span>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant={asset.status === 'published' ? 'default' : 'secondary'}>
              {asset.status}
            </Badge>
          </div>
        </div>
        {!readonly && onEdit && (
          <Button onClick={onEdit}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Metadata
          </Button>
        )}
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="rights">Rights</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <dl className="space-y-1">
                  <CopyableField label="Title" value={asset.title} fieldKey="title" />
                  <Separator />
                  <CopyableField label="Description" value={asset.description || ''} fieldKey="description" />
                  <Separator />
                  
                  <div className="py-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-2">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {asset.tags && asset.tags.length > 0 ? (
                        asset.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="mr-1 h-3 w-3" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No tags</span>
                      )}
                    </dd>
                  </div>
                  
                  <Separator />
                  
                  <div className="py-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-2">Collections</dt>
                    <dd>
                      {asset.collections && asset.collections.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {asset.collections.map((collection) => (
                            <Badge key={collection} variant="secondary" className="text-xs">
                              {collection}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No collections</span>
                      )}
                    </dd>
                  </div>
                  
                  <Separator />
                  <CopyableField label="Location" value={asset.location || ''} fieldKey="location" />
                </dl>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Information Tab */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="mr-2 h-5 w-5" />
                Technical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <dl className="space-y-1">
                  <CopyableField label="Asset ID" value={asset.id} fieldKey="id" />
                  <Separator />
                  <CopyableField label="File Size" value={formatFileSize(asset.size)} fieldKey="size" />
                  <Separator />
                  
                  {asset.dimensions && (
                    <>
                      <CopyableField 
                        label="Dimensions" 
                        value={`${asset.dimensions.width} × ${asset.dimensions.height} px`}
                        fieldKey="dimensions" 
                      />
                      <Separator />
                    </>
                  )}
                  
                  {asset.duration && (
                    <>
                      <CopyableField label="Duration" value={asset.duration} fieldKey="duration" />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.format && (
                    <>
                      <CopyableField label="Format" value={asset.metadata.format} fieldKey="format" />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.codec && (
                    <>
                      <CopyableField label="Codec" value={asset.metadata.codec} fieldKey="codec" />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.bitrate && (
                    <>
                      <CopyableField 
                        label="Bitrate" 
                        value={`${asset.metadata.bitrate} kbps`} 
                        fieldKey="bitrate" 
                      />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.framerate && (
                    <>
                      <CopyableField 
                        label="Framerate" 
                        value={`${asset.metadata.framerate} fps`} 
                        fieldKey="framerate" 
                      />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.colorSpace && (
                    <>
                      <CopyableField label="Color Space" value={asset.metadata.colorSpace} fieldKey="colorSpace" />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.audioChannels && (
                    <>
                      <CopyableField 
                        label="Audio Channels" 
                        value={asset.metadata.audioChannels.toString()} 
                        fieldKey="audioChannels" 
                      />
                      <Separator />
                    </>
                  )}
                  
                  {asset.metadata?.sampleRate && (
                    <>
                      <CopyableField 
                        label="Sample Rate" 
                        value={`${asset.metadata.sampleRate} Hz`} 
                        fieldKey="sampleRate" 
                      />
                    </>
                  )}
                </dl>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rights & Attribution Tab */}
        <TabsContent value="rights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Copyright className="mr-2 h-5 w-5" />
                Rights & Attribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <dl className="space-y-1">
                  <CopyableField label="Creator" value={asset.creator || ''} fieldKey="creator" />
                  <Separator />
                  <CopyableField label="Copyright" value={asset.copyright || ''} fieldKey="copyright" />
                  <Separator />
                  <CopyableField label="Created By" value={asset.createdBy || ''} fieldKey="createdBy" />
                  <Separator />
                  <CopyableField label="Updated By" value={asset.updatedBy || ''} fieldKey="updatedBy" />
                  <Separator />
                  <CopyableField 
                    label="Version" 
                    value={asset.version?.toString() || '1'} 
                    fieldKey="version" 
                  />
                  
                  {asset.parentId && (
                    <>
                      <Separator />
                      <div className="py-2">
                        <dt className="text-sm font-medium text-muted-foreground mb-1">Parent Asset</dt>
                        <dd className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{asset.parentId}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {asset.customFields && Object.keys(asset.customFields).length > 0 ? (
                  <dl className="space-y-1">
                    {Object.entries(asset.customFields).map(([key, value], index) => (
                      <div key={key}>
                        <CopyableField label={key} value={value} fieldKey={`custom_${key}`} />
                        {index < Object.entries(asset.customFields!).length - 1 && <Separator />}
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Archive className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">No custom fields defined</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <dl className="space-y-1">
                  <div className="py-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Created
                    </dt>
                    <dd className="text-sm text-foreground">
                      {format(new Date(asset.createdAt), 'PPpp')}
                      {asset.createdBy && (
                        <span className="text-muted-foreground"> by {asset.createdBy}</span>
                      )}
                    </dd>
                  </div>
                  
                  <Separator />
                  
                  <div className="py-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Last Updated
                    </dt>
                    <dd className="text-sm text-foreground">
                      {format(new Date(asset.updatedAt), 'PPpp')}
                      {asset.updatedBy && (
                        <span className="text-muted-foreground"> by {asset.updatedBy}</span>
                      )}
                    </dd>
                  </div>
                  
                  <Separator />
                  
                  <div className="py-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-2">File Locations</dt>
                    <dd className="space-y-2 text-sm">
                      {asset.stagingKey && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Staging:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{asset.stagingKey}</code>
                        </div>
                      )}
                      {asset.masterKey && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Master:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{asset.masterKey}</code>
                        </div>
                      )}
                      {asset.previewUrl && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Preview:</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                      )}
                      {asset.thumbnailUrl && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Thumbnail:</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      )}
                    </dd>
                  </div>
                </dl>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}