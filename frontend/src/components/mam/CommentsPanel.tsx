"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createComment, deleteComment, openCommentsWebSocket, updateComment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquarePlus, CheckCircle2, Reply, X, Clock, Trash2, RotateCcw } from "lucide-react";

type CommentItem = {
  id: string;
  user?: { id?: string; name?: string };
  timecode: number;
  body: string;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function formatTimecode(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}:${rs.toString().padStart(2, "0")}`;
}

export function CommentsPanel({
  assetId,
  currentTime = 0,
  onSeek,
}: {
  assetId: string;
  currentTime?: number;
  onSeek?: (sec: number) => void;
}) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect WS for live updates
  useEffect(() => {
    try {
      const ws = openCommentsWebSocket(assetId);
      wsRef.current = ws;
      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (!data?.type) return;
          if (data.type === "created") {
            setItems((prev) => [data.comment, ...prev]);
          } else if (data.type === "updated") {
            setItems((prev) => prev.map((c) => (c.id === data.comment.id ? data.comment : c)));
          } else if (data.type === "deleted") {
            setItems((prev) => prev.filter((c) => c.id !== data.id));
          }
        } catch {}
      });
      ws.addEventListener("error", () => {});
      return () => ws.close();
    } catch {
      return;
    }
  }, [assetId]);

  const sorted = useMemo(() => items.slice().sort((a, b) => a.timecode - b.timecode), [items]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      const created = await createComment(assetId, { timecode: currentTime ?? 0, body: draft.trim() });
      setItems((prev) => [created, ...prev]);
      setDraft("");
    } catch (e) {
      // swallow, UI remains
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(id: string, resolved: boolean) {
    try {
      const updated = await updateComment(id, { resolvedAt: resolved ? new Date().toISOString() : null });
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment(id);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Add a comment</label>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Comment at ${formatTimecode(currentTime ?? 0)}`}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAdd} disabled={submitting || !draft.trim()}>
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Add at {formatTimecode(currentTime ?? 0)}
            </Button>
          </div>
        </div>

        <Separator />

        <ul className="space-y-3">
          {sorted.map((c) => (
            <li key={c.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={c.resolvedAt ? "secondary" : "default"}>
                    {formatTimecode(c.timecode)}
                  </Badge>
                  <button
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => onSeek?.(c.timecode)}
                  >
                    Jump to time
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {!c.resolvedAt ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => handleResolve(c.id, true)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Resolve</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => handleResolve(c.id, false)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm whitespace-pre-wrap">{c.body}</div>
            </li>
          ))}
          {sorted.length === 0 && (
            <div className="text-sm text-muted-foreground">No comments yet. Be the first to add one.</div>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
