"use client";

import { useEffect, useState } from "react";
import { listShares, revokeShare } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Trash2 } from "lucide-react";

type ShareRow = {
  id: string;
  token?: string;
  scope?: string;
  assetId?: string;
  collectionId?: string;
  projectId?: string;
  permissions: { canView: boolean; canDownload?: boolean; canComment?: boolean };
  createdAt?: string;
  expiresAt?: string;
};

function shareUrl(token?: string) {
  if (!token || typeof window === 'undefined') return '';
  return `${window.location.origin}/shares/${token}`;
}

export default function SharesPage() {
  const [rows, setRows] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listShares();
        setRows(data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleRevoke(id: string) {
    try {
      await revokeShare(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shares</h1>
      </div>
      <Separator />
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="secondary">{r.scope || (r.assetId ? 'asset' : r.collectionId ? 'collection' : 'project')}</Badge>
                <span className="text-muted-foreground text-xs">{r.expiresAt ? `expires ${new Date(r.expiresAt).toLocaleString()}` : 'never expires'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {r.permissions.canView && <Badge variant="outline">View</Badge>}
                {r.permissions.canDownload && <Badge variant="outline">Download</Badge>}
                {r.permissions.canComment && <Badge variant="outline">Comment</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={async () => { const u = shareUrl(r.token); if (u) await navigator.clipboard.writeText(u); }}>
                  <Copy className="h-4 w-4 mr-1" /> Copy Link
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleRevoke(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No active shares.</div>
        )}
      </div>
    </div>
  );
}

