'use client';

import { useState, useEffect } from 'react';
import { AssetGrid } from '@/components/mam/AssetGrid';
import { MetadataEditor } from '@/components/mam/MetadataEditor';
import { MediaPlayer } from '@/components/mam/MediaPlayer';
import { CollectionsPanel } from '@/components/mam/CollectionsPanel';
import { UserManagement } from '@/components/mam/UserManagement';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FolderOpen, 
  Users, 
  Settings, 
  BarChart3,
  Search,
  Bell,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { Asset, Collection, User } from '@/types/asset';

export default function ProfessionalMAM() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState('assets');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssets();
    loadCollections();
    loadUsers();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to Asset type
        const transformedAssets: Asset[] = (data.items || []).map((item: { id: string; title?: string; staging_key?: string; type?: string; status?: string; master_key?: string; size?: number; duration?: number; created_at?: string; updated_at?: string; metadata?: Record<string, unknown>; tags?: string[]; }) => ({
          id: item.id,
          title: item.title || item.staging_key || 'Untitled',
          type: item.type || 'other',
          status: item.status || 'draft',
          stagingKey: item.staging_key,
          masterKey: item.master_key,
          size: item.size,
          duration: item.duration,
          tags: item.tags || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at || item.created_at,
        }));
        setAssets(transformedAssets);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollections = async () => {
    // Mock data for now
    setCollections([
      {
        id: '1',
        name: 'Marketing Campaign 2024',
        description: 'Assets for Q1 marketing campaign',
        assetCount: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user1',
        isPublic: false,
        tags: ['marketing', 'q1-2024']
      },
      {
        id: '2',
        name: 'Product Launch Videos',
        description: 'Video content for new product launch',
        assetCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user2',
        isPublic: true,
        tags: ['product', 'video', 'launch']
      }
    ]);
  };

  const loadUsers = async () => {
    // Mock data for now
    setUsers([
      {
        id: '1',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'Admin',
        createdAt: new Date().toISOString(),
        status: 'active'
      },
      {
        id: '2',
        email: 'editor@example.com',
        displayName: 'Editor User',
        role: 'Editor',
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    ]);
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleBatchAction = async (action: string, assetIds: string[]) => {
    console.log(`Performing ${action} on ${assetIds.length} assets`);
    // Implement batch actions
  };

  const handleMetadataSave = async (metadata: Partial<Asset>) => {
    if (!editingAsset) return;
    
    console.log('Saving metadata:', metadata);
    // Implement API call to save metadata
    
    // Update local state
    setAssets(prev => prev.map(a => 
      a.id === editingAsset.id ? { ...a, ...metadata } : a
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">Media Asset Manager</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="pl-10 pr-4 py-2 w-96 rounded-lg border bg-background"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="default">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-140px)]">
          <TabsList className="grid w-fit grid-cols-4 mb-6">
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading assets...</div>
              </div>
            ) : (
              <AssetGrid
                assets={assets}
                onAssetSelect={handleAssetSelect}
                onBatchAction={handleBatchAction}
              />
            )}
          </TabsContent>

          <TabsContent value="collections" className="h-full">
            <CollectionsPanel
              collections={collections}
              onCollectionSelect={(collection) => console.log('Selected collection:', collection)}
            />
          </TabsContent>

          <TabsContent value="users" className="h-full">
            <UserManagement
              users={users}
              onUserUpdate={(user) => console.log('Update user:', user)}
            />
          </TabsContent>

          <TabsContent value="analytics" className="h-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
                <p className="text-3xl font-bold mt-2">{assets.length}</p>
                <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground">Storage Used</h3>
                <p className="text-3xl font-bold mt-2">2.4 TB</p>
                <p className="text-xs text-muted-foreground mt-2">75% of quota</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
                <p className="text-3xl font-bold mt-2">{users.length}</p>
                <p className="text-xs text-muted-foreground mt-2">All users active</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground">Collections</h3>
                <p className="text-3xl font-bold mt-2">{collections.length}</p>
                <p className="text-xs text-muted-foreground mt-2">2 new this week</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Asset Preview Modal */}
      {selectedAsset && selectedAsset.type === 'video' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedAsset(null)}>
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedAsset.title}</h2>
              <Button variant="outline" onClick={() => setEditingAsset(selectedAsset)}>
                Edit Metadata
              </Button>
            </div>
            <MediaPlayer
              src={selectedAsset.previewUrl || ''}
              type="video"
              title={selectedAsset.title}
            />
          </div>
        </div>
      )}

      {/* Metadata Editor Modal */}
      {editingAsset && (
        <MetadataEditor
          asset={editingAsset}
          onSave={handleMetadataSave}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
}