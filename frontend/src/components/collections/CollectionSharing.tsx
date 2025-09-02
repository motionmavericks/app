'use client';

import React, { useState } from 'react';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { Collection, CollectionShare } from '@/types/collection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Share,
  Link,
  Users,
  Eye,
  Download,
  MessageSquare,
  Copy,
  Trash2,
  Calendar,
  Globe,
  Lock,
  Mail,
  Plus,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CollectionSharingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection | null;
}

export function CollectionSharing({
  open,
  onOpenChange,
  collection
}: CollectionSharingProps) {
  const { createShare, deleteShare, getCollectionShares } = useCollectionStore();
  
  const [activeTab, setActiveTab] = useState('links');
  const [newLinkExpiry, setNewLinkExpiry] = useState('7d');
  const [newLinkPermissions, setNewLinkPermissions] = useState({
    canView: true,
    canDownload: true,
    canComment: false,
  });
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('viewer');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!collection) return null;

  const shares = getCollectionShares(collection.id);
  const linkShares = shares.filter(share => share.type === 'link');
  const userShares = shares.filter(share => share.type === 'user');

  const createPublicLink = () => {
    const expiryDate = newLinkExpiry === 'never' ? undefined : (() => {
      const date = new Date();
      switch (newLinkExpiry) {
        case '1h': date.setHours(date.getHours() + 1); break;
        case '1d': date.setDate(date.getDate() + 1); break;
        case '7d': date.setDate(date.getDate() + 7); break;
        case '30d': date.setDate(date.getDate() + 30); break;
        default: return undefined;
      }
      return date.toISOString();
    })();

    createShare(collection.id, {
      type: 'link',
      collectionId: collection.id,
      token: crypto.randomUUID(),
      expiresAt: expiryDate,
      permissions: newLinkPermissions,
      createdBy: 'current-user',
    });
  };

  const shareWithUser = () => {
    if (!userEmail.trim()) return;

    createShare(collection.id, {
      type: 'user',
      collectionId: collection.id,
      userId: userEmail, // In real app, this would be resolved to user ID
      permissions: {
        canView: true,
        canDownload: userRole !== 'viewer',
        canComment: userRole === 'editor' || userRole === 'admin',
      },
      createdBy: 'current-user',
    });

    setUserEmail('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/collections/shared/${token}`;
  };

  const formatExpiry = (expiresAt?: string) => {
    if (!expiresAt) return 'Never expires';
    const date = new Date(expiresAt);
    if (date < new Date()) return 'Expired';
    return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Collection
          </DialogTitle>
          <DialogDescription>
            Share &quot;{collection.name}&quot; with others via links or direct user invitations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Links
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Direct Sharing
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="links" className="space-y-6">
              {/* Create New Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Share Link
                  </CardTitle>
                  <CardDescription>
                    Generate a shareable link that anyone can use to access this collection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Link Expires</Label>
                      <Select value={newLinkExpiry} onValueChange={setNewLinkExpiry}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="1d">1 day</SelectItem>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Can view assets</span>
                        </div>
                        <Switch
                          checked={newLinkPermissions.canView}
                          onCheckedChange={(checked) =>
                            setNewLinkPermissions(prev => ({ ...prev, canView: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Can download assets</span>
                        </div>
                        <Switch
                          checked={newLinkPermissions.canDownload}
                          onCheckedChange={(checked) =>
                            setNewLinkPermissions(prev => ({ ...prev, canDownload: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Can add comments</span>
                        </div>
                        <Switch
                          checked={newLinkPermissions.canComment}
                          onCheckedChange={(checked) =>
                            setNewLinkPermissions(prev => ({ ...prev, canComment: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={createPublicLink} className="w-full">
                    <Link className="h-4 w-4 mr-2" />
                    Generate Share Link
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Links */}
              {linkShares.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Active Share Links</CardTitle>
                    <CardDescription>
                      Manage existing share links for this collection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-4">
                        {linkShares.map((share) => (
                          <div
                            key={share.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm truncate">
                                  {getShareUrl(share.token!)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatExpiry(share.expiresAt)}
                                </span>
                                
                                <div className="flex items-center gap-2">
                                  {share.permissions.canView && (
                                    <Badge variant="outline" className="h-5">
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Badge>
                                  )}
                                  {share.permissions.canDownload && (
                                    <Badge variant="outline" className="h-5">
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Badge>
                                  )}
                                  {share.permissions.canComment && (
                                    <Badge variant="outline" className="h-5">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Comment
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(getShareUrl(share.token!))}
                                className="h-8 w-8 p-0"
                              >
                                {copiedLink === getShareUrl(share.token!) ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteShare(share.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              {/* Add User */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Invite User
                  </CardTitle>
                  <CardDescription>
                    Share this collection directly with specific users in your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="userEmail">Email Address</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        placeholder="user@example.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Role</Label>
                      <Select value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div>
                              <div>Viewer</div>
                              <div className="text-xs text-muted-foreground">Can view only</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div>
                              <div>Editor</div>
                              <div className="text-xs text-muted-foreground">Can view, download, comment</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div>
                              <div>Admin</div>
                              <div className="text-xs text-muted-foreground">Full access</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={shareWithUser} disabled={!userEmail.trim()} className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>

              {/* Shared Users */}
              {userShares.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shared Users</CardTitle>
                    <CardDescription>
                      Users who have direct access to this collection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-3">
                        {userShares.map((share) => (
                          <div
                            key={share.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{share.userId}</div>
                                <div className="text-xs text-muted-foreground">
                                  Added {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {share.permissions.canView && (
                                  <Badge variant="outline" className="h-5">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Badge>
                                )}
                                {share.permissions.canDownload && (
                                  <Badge variant="outline" className="h-5">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Badge>
                                )}
                                {share.permissions.canComment && (
                                  <Badge variant="outline" className="h-5">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Comment
                                  </Badge>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteShare(share.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Collection Visibility */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {collection.isPublic ? (
              <Globe className="h-4 w-4 text-green-600" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {collection.isPublic ? 'Public Collection' : 'Private Collection'}
            </span>
          </div>
          <Badge variant={collection.isPublic ? 'default' : 'secondary'}>
            {collection.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}