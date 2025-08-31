"use client";
import { useState } from "react";
import { presign } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [playHref, setPlayHref] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;
    setStatus("Requesting presign...");
    const key = `staging/${crypto.randomUUID()}/${file.name}`;
    const { url } = await presign({ key, contentType: file.type || "application/octet-stream" });
    setStatus("Uploading...");
    const put = await fetch(url, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } });
    if (!put.ok) {
      const text = await put.text();
      throw new Error(`PUT failed: ${put.status} ${text}`);
    }
    setStatus("Uploaded to staging. Promoting to masters...");
    const promoteRes = await fetch((process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000") + "/api/promote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stagingKey: key })
    });
    if (!promoteRes.ok) {
      const txt = await promoteRes.text();
      throw new Error(`Promote failed: ${promoteRes.status} ${txt}`);
    }
    const pr = await promoteRes.json();
    const previewPrefix = `previews/${key.replace(/^staging\//, '')}`;
    const href = pr.assetId ? `/assets/${pr.assetId}` : `/play?p=${encodeURIComponent(previewPrefix)}`;
    setPlayHref(href);
    setStatus(`Promotion enqueued preview. masterKey=${pr.masterKey} jobId=${pr.jobId || "n/a"}.`);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Upload</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button className="mt-3 px-3 py-2 border rounded" disabled={!file} onClick={() => onUpload().catch((e) => setStatus(e.message))}>
        Upload to Staging
      </button>
      <div className="mt-3 text-sm text-gray-600">{status} {playHref ? (<a className="text-blue-600 underline" href={playHref}>Open player</a>) : null}</div>
    </div>
  );
}
