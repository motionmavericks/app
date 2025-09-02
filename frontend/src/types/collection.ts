export interface Collection {
  id: string;
  name: string;
  description?: string;
  type: 'manual' | 'smart';
  parentId?: string;
  assetIds: string[];
  assetCount: number;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  tags?: string[];
  color?: string;
  smartRules?: SmartCollectionRule[];
  permissions?: CollectionPermission[];
}

export interface SmartCollectionRule {
  id: string;
  field: 'title' | 'type' | 'tags' | 'createdAt' | 'updatedAt' | 'creator' | 'size' | 'status' | 'customField';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'not' | 'exists' | 'regex';
  value: string | number | string[] | { min: number; max: number };
  customFieldKey?: string;
}

export interface CollectionPermission {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  canShare: boolean;
  canDelete: boolean;
}

export interface CollectionFolder {
  id: string;
  name: string;
  parentId?: string;
  children: CollectionFolder[];
  collections: Collection[];
  color?: string;
  isExpanded: boolean;
}

export interface CollectionShare {
  id: string;
  collectionId: string;
  type: 'link' | 'user';
  token?: string;
  userId?: string;
  expiresAt?: string;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canComment: boolean;
  };
  createdAt: string;
  createdBy: string;
}