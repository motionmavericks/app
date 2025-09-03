export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

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