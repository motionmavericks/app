const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export async function presign(input: {
  key: string;
  contentType?: string;
  bucket?: string;
  expires?: number;
}) {
  const res = await fetch(`${API_BASE}/presign`, {
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

