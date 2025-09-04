"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type UserRow = { id: string; email: string; display_name?: string; role?: string; status?: string; created_at?: string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Placeholder: replace with real admin endpoint when available
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin · Users</h1>
      <Separator />
      <div className="space-y-2">
        {rows.map((u) => (
          <Card key={u.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{u.display_name || u.email}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              {u.role && <Badge variant="secondary">{u.role}</Badge>}
              {u.status && <Badge variant="outline">{u.status}</Badge>}
            </CardContent>
          </Card>
        ))}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No users to display.</div>
        )}
      </div>
    </div>
  );
}

