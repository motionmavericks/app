"use client";

import { useEffect, useState } from "react";
import { createShare, listShares, revokeShare } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Download, Eye, Link as LinkIcon, MessageSquare, Trash2 } from "lucide-react";

type ShareRecord = {
  id: string;
  token?: string;
  permissions: { canView: boolean; canDownload?: boolean; canComment?: boolean };
  expiresAt?: string;
  createdAt?: string;
  userId?: string;
  type?: "link" | "user";
};

export function AssetShareDialog({ open, onOpenChange, assetId }: { open: boolean; onOpenChange: (open: boolean) => void; assetId: string; }) {
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [expiry, setExpiry] = useState("7d");
  const [perms, setPerms] = useState({ canView: true, canDownload: true, canComment: true });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const data = await listShares({ assetId });
        setShares(data);
      } catch {
        setShares([]);
      }
    })();
  }, [open, assetId]);

  function makeExpiry(): string | undefined {
    if (expiry === "never") return undefined;
    const d = new Date();
    if (expiry === "1h") d.setHours(d.getHours() + 1);
    else if (expiry === "1d") d.setDate(d.getDate() + 1);
    else if (expiry === "7d") d.setDate(d.getDate() + 7);
    else if (expiry === "30d") d.setDate(d.getDate() + 30);
    return d.toISOString();
  }

  async function handleCreate() {
    try {
      const created = await createShare({ 
        scope: 'asset' as const, 
        assetId, 
        permissions: perms, 
        expiresAt: makeExpiry() 
      });
      setShares((prev) => [created, ...prev]);
    } catch {}
  }

  function shareUrl(token?: string) {
    if (!token) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/shares/${token}`;
  }

  async function handleRevoke(id: string) {
    try { await revokeShare(id); setShares((prev) => prev.filter((s) => s.id !== id)); } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share Asset</DialogTitle>
          <DialogDescription>Create and manage share links for this asset.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Link</CardTitle>
              <CardDescription>Configure permissions and expiry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expires</Label>
                  <select className="mt-1 w-full border rounded-md h-9 px-2" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Can view</span></div>
                  <Switch checked={perms.canView} onCheckedChange={(v) => setPerms((p) => ({ ...p, canView: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Download className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Can download</span></div>
                  <Switch checked={perms.canDownload} onCheckedChange={(v) => setPerms((p) => ({ ...p, canDownload: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Can comment</span></div>
                  <Switch checked={perms.canComment} onCheckedChange={(v) => setPerms((p) => ({ ...p, canComment: v }))} />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate}>
                <LinkIcon className="h-4 w-4 mr-2" />Create Share Link
              </Button>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-medium mb-2">Active Links</h3>
            <div className="space-y-2">
              {shares.filter((s) => s.type !== 'user').map((s) => (
                <div key={s.id} className="flex items-center justify-between border rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Link</Badge>
                    <span className="text-sm text-muted-foreground">{s.expiresAt ? `Expires ${new Date(s.expiresAt).toLocaleString()}` : 'Never expires'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={async () => { const u = shareUrl(s.token); if (u) { await navigator.clipboard.writeText(u); setCopied(s.id); setTimeout(() => setCopied(null), 1200);} }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleRevoke(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {shares.filter((s) => s.type !== 'user').length === 0 && (
                <div className="text-sm text-muted-foreground">No active links.</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

