export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
export const EDGE_BASE = process.env.NEXT_PUBLIC_EDGE_BASE || "http://localhost:8080";

export async function presign(input: {
  key: string;
  contentType?: string;
  bucket?: string;
  expires?: number;
}) {
  const res = await fetch(`${API_BASE}/api/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Presign failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { url: string; bucket: string; key: string; expiresIn: number };
}

export async function getAsset(id: string) {
  const res = await fetch(`${API_BASE}/api/assets/${id}`, {
    method: "GET",
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get asset failed: ${res.status} ${text}`);
  }
  return await res.json();
}

export async function updateAsset(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/assets/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update asset failed: ${res.status} ${text}`);
  }
  return await res.json();
}

export async function promote(input: { stagingKey: string }) {
  const res = await fetch(`${API_BASE}/api/promote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Promote failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { masterKey: string; assetId?: string; jobId?: string };
}

export async function signPreview(input: { preview_prefix: string; playlist?: string; expSec?: number }) {
  const res = await fetch(`${API_BASE}/api/sign-preview`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sign preview failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { url: string; edge?: boolean; exp?: number };
}

export async function getPreviewStatus(prefix: string) {
  const res = await fetch(`${API_BASE}/api/preview/status?prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Preview status failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { ready: boolean };
}

export function previewEvents(prefix: string, onStatus: (ready: boolean) => void): EventSource | null {
  if (typeof window === 'undefined' || !('EventSource' in window)) return null;
  const es = new EventSource(`${API_BASE}/api/preview/events?prefix=${encodeURIComponent(prefix)}`);
  es.addEventListener('status', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data as string);
      if (typeof data?.ready === 'boolean') onStatus(data.ready);
    } catch {
      // ignore parse errors
    }
  });
  return es;
}

// Comments
export async function createComment(assetId: string, input: { timecode: number; body: string }) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create comment failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

export async function updateComment(commentId: string, input: { body?: string; resolvedAt?: string | null }) {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Update comment failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

export async function deleteComment(commentId: string) {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete comment failed: ${res.status} ${await res.text()}`);
  return true;
}

export function openCommentsWebSocket(assetId: string): WebSocket {
  const apiUrl = new URL(API_BASE);
  const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsBase = `${wsProtocol}//${apiUrl.host}`;
  return new WebSocket(`${wsBase}/ws/comments?assetId=${encodeURIComponent(assetId)}`);
}

// Shares
type ShareScope = { scope: 'asset'; assetId: string } | { scope: 'collection'; collectionId: string } | { scope: 'project'; projectId: string };

export async function createShare(input: ShareScope & { permissions: { canView: boolean; canDownload?: boolean; canComment?: boolean }; expiresAt?: string; password?: string }) {
  const res = await fetch(`${API_BASE}/api/shares`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create share failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

export async function listShares(filter?: Partial<{ assetId: string; collectionId: string; projectId: string }>) {
  const params = new URLSearchParams();
  if (filter?.assetId) params.set('assetId', filter.assetId);
  if (filter?.collectionId) params.set('collectionId', filter.collectionId);
  if (filter?.projectId) params.set('projectId', filter.projectId);
  const res = await fetch(`${API_BASE}/api/shares${params.toString() ? `?${params}` : ''}`);
  if (!res.ok) throw new Error(`List shares failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

export async function revokeShare(id: string) {
  const res = await fetch(`${API_BASE}/api/shares/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Revoke share failed: ${res.status} ${await res.text()}`);
  return true;
}
