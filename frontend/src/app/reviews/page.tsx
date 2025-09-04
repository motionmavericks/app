"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

type AssetRow = {
  id: string;
  title?: string;
  status?: string;
  thumbnail_url?: string;
  updated_at?: string;
  tags?: string[];
};

export default function ReviewsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
      try {
        const res = await fetch(`${apiBase}/api/assets?status=review`);
        const data = await res.json();
        const items: AssetRow[] = (data.items || data || []).map((a: {
          id: string;
          title?: string;
          staging_key?: string;
          status?: string;
          thumbnail_url?: string;
          updated_at?: string;
          tags?: string[];
        }) => ({
          id: a.id,
          title: a.title || a.staging_key,
          status: a.status,
          thumbnail_url: a.thumbnail_url,
          updated_at: a.updated_at,
          tags: a.tags,
        }));
        setRows(items);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reviews</h1>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <div className="aspect-video bg-muted" style={{ backgroundImage: r.thumbnail_url ? `url(${r.thumbnail_url})` : undefined, backgroundSize: 'cover' }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-base truncate">{r.title || r.id}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{r.updated_at && formatRelativeTime(r.updated_at)}</div>
              <div className="flex items-center gap-2">
                {r.status && <Badge variant="secondary">{r.status}</Badge>}
                <Button size="sm" onClick={() => router.push(`/assets/${r.id}`)}>Open</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No items awaiting review.</div>
        )}
      </div>
    </div>
  );
}

