export interface Asset {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'image' | 'audio' | 'document' | 'other';
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  stagingKey?: string;
  masterKey?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  size?: number;
  duration?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  tags?: string[];
  collections?: string[];
  creator?: string;
  copyright?: string;
  location?: string;
  customFields?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  parentId?: string;
  metadata?: {
    format?: string;
    codec?: string;
    bitrate?: number;
    framerate?: number;
    colorSpace?: string;
    audioChannels?: number;
    sampleRate?: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  assetCount: number;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  tags?: string[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'Admin' | 'Manager' | 'Editor' | 'Viewer';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
}