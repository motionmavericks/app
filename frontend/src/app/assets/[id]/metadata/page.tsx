'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Asset } from '@/types/asset';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { MetadataViewer } from '@/components/metadata/MetadataViewer';
import { MetadataEditor } from '@/components/metadata/MetadataEditor';
import { BulkMetadataEditor } from '@/components/metadata/BulkMetadataEditor';
import { 
  ArrowLeft, 
  Edit3, 
  Download, 
  Share2, 
  MoreVertical,
  History,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAssetStore } from '@/lib/stores/asset-store';
import { 
  CustomFieldDefinition,
  ValidationError,
  validateMetadataStandards
} from '@/lib/metadata/validation';

// Mock data - replace with actual API calls
const mockAsset: Asset = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Corporate Training Video - Q1 2024',
  description: 'Comprehensive training video covering company policies, safety procedures, and new employee orientation materials for the first quarter of 2024.',
  type: 'video',
  status: 'published',
  stagingKey: 'staging/uploads/training-video-q1-2024.mp4',
  masterKey: 'masters/2024/01/training-video-q1-2024.mp4',
  previewUrl: 'https://preview.example.com/training-video-q1-2024.m3u8',
  thumbnailUrl: 'https://thumbnails.example.com/training-video-q1-2024.jpg',
  size: 2147483648, // 2GB
  duration: '00:45:30',
  dimensions: {
    width: 1920,
    height: 1080
  },
  tags: ['training', 'corporate', 'q1-2024', 'orientation', 'policies', 'safety'],
  collections: ['Training Materials', 'Q1 2024 Content'],
  creator: 'Sarah Johnson',
  copyright: '© 2024 Acme Corporation. All rights reserved.',
  location: 'New York Office, Conference Room A',
  customFields: {
    'department': 'Human Resources',
    'training-level': 'Beginner',
    'languages': 'English, Spanish',
    'compliance-standard': 'ISO 27001',
    'review-date': '2024-04-01',
    'approval-by': 'John Smith - HR Director'
  },
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
  createdBy: 'sarah.johnson@company.com',
  updatedBy: 'admin@company.com',
  version: 2,
  metadata: {
    format: 'MP4',
    codec: 'H.264',
    bitrate: 5000,
    framerate: 30,
    colorSpace: 'Rec. 709',
    audioChannels: 2,
    sampleRate: 48000
  }
};

const mockCustomFields: CustomFieldDefinition[] = [
  {
    id: 'department',
    name: 'department',
    type: 'select',
    label: 'Department',
    description: 'The department responsible for this content',
    required: true,
    options: ['Human Resources', 'Marketing', 'Engineering', 'Sales', 'Finance']
  },
  {
    id: 'training-level',
    name: 'training-level',
    type: 'select',
    label: 'Training Level',
    options: ['Beginner', 'Intermediate', 'Advanced']
  },
  {
    id: 'languages',
    name: 'languages',
    type: 'multiselect',
    label: 'Available Languages',
    options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']
  },
  {
    id: 'compliance-standard',
    name: 'compliance-standard',
    type: 'text',
    label: 'Compliance Standard',
    description: 'Regulatory or compliance standard this content adheres to'
  },
  {
    id: 'review-date',
    name: 'review-date',
    type: 'date',
    label: 'Review Date',
    description: 'Date when this content needs to be reviewed'
  },
  {
    id: 'approval-by',
    name: 'approval-by',
    type: 'text',
    label: 'Approved By',
    description: 'Person who approved this content'
  }
];

export default function AssetMetadataPage() {
  const params = useParams();
  const router = useRouter();
  const { getSelectedAssets } = useAssetStore();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationSchema, setValidationSchema] = useState<string>('none');

  const selectedAssets = getSelectedAssets();
  const assetId = params.id as string;

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => {
      setAsset(mockAsset);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [assetId]);

  useEffect(() => {
    // Validate metadata against current schema
    if (asset && validationSchema !== 'none') {
      const validationData: Record<string, string | number | boolean | string[]> = {
        ...(asset.customFields || {})
      };
      
      // Add safe field conversions
      if (asset.title) validationData.title = asset.title;
      if (asset.description) validationData.description = asset.description;
      if (asset.creator) validationData.creator = asset.creator;
      if (asset.copyright) validationData.copyright = asset.copyright;
      if (asset.location) validationData.location = asset.location;
      if (asset.tags) validationData.tags = asset.tags;
      
      const errors = validateMetadataStandards(validationData, validationSchema);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [asset, validationSchema]);

  const handleSaveMetadata = async (metadata: Partial<Asset>) => {
    // Mock save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (asset) {
      const updatedAsset = { 
        ...asset, 
        ...metadata, 
        updatedAt: new Date().toISOString() 
      };
      setAsset(updatedAsset);
      toast.success('Metadata updated successfully');
    }
  };

  const handleBulkSave = async (operations: unknown[], assetIds: string[]) => {
    // Mock bulk save operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(`Bulk metadata updated for ${assetIds.length} assets`);
  };

  const handleExport = () => {
    if (!asset) return;
    
    const exportData = {
      id: asset.id,
      title: asset.title,
      description: asset.description,
      type: asset.type,
      status: asset.status,
      tags: asset.tags,
      creator: asset.creator,
      copyright: asset.copyright,
      location: asset.location,
      customFields: asset.customFields,
      technicalMetadata: asset.metadata,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata-${asset.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Metadata exported successfully');
  };

  const handleCopyId = () => {
    if (asset) {
      navigator.clipboard.writeText(asset.id);
      toast.success('Asset ID copied to clipboard');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Asset URL copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Asset Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The requested asset could not be found or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/mam">MAM</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/assets">Assets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Metadata</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Asset Metadata</h1>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <span className="text-sm">ID: {asset.id}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyId}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Validation Status */}
          {validationSchema !== 'none' && (
            <div className="flex items-center space-x-2">
              {validationErrors.length === 0 ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {validationErrors.length} Issues
                </Badge>
              )}
            </div>
          )}

          {/* Schema Selector */}
          <select
            value={validationSchema}
            onChange={(e) => setValidationSchema(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="none">No Validation</option>
            <option value="dublin-core">Dublin Core</option>
          </select>

          {/* Bulk Edit Button */}
          {selectedAssets.length > 1 && (
            <Button
              variant="outline"
              onClick={() => setIsBulkEditing(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              Bulk Edit ({selectedAssets.length})
            </Button>
          )}

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Asset
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Metadata
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <History className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Button */}
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Metadata
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-medium mr-2">{error.field}:</span>
                  <span>{error.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Metadata Viewer */}
      <MetadataViewer
        asset={asset}
        onEdit={() => setIsEditing(true)}
      />

      {/* Metadata Editor Modal */}
      {isEditing && (
        <MetadataEditor
          asset={asset}
          onSave={handleSaveMetadata}
          onClose={() => setIsEditing(false)}
          customFields={mockCustomFields}
          validationSchema={validationSchema}
        />
      )}

      {/* Bulk Metadata Editor Modal */}
      {isBulkEditing && (
        <BulkMetadataEditor
          assets={selectedAssets}
          onSave={handleBulkSave}
          onClose={() => setIsBulkEditing(false)}
          customFields={mockCustomFields}
        />
      )}
    </div>
  );
}