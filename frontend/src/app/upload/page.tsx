"use client";
import { useState } from "react";
import { presign, API_BASE } from "@/lib/api";

function sanitizeName(name: string): string {
  // Remove any path separators and restrict to safe chars
  const base = name.split(/[/\\]/).pop() || "file";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_");
  return cleaned.length > 128 ? cleaned.slice(-128) : cleaned || "file";
}

const ALLOWED_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/webm",
  "audio/mpeg",
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [playHref, setPlayHref] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;
    // Basic MIME validation
    if (file.type && !ALLOWED_MIME.includes(file.type)) {
      setStatus("Unsupported file type. Please choose a common video/audio file.");
      return;
    }
    setStatus("Requesting presign...");
    const safeName = sanitizeName(file.name || "upload");
    const key = `staging/${crypto.randomUUID()}/${safeName}`;
    const { url } = await presign({ key, contentType: file.type || "application/octet-stream" });
    setStatus("Uploading...");
    const put = await fetch(url, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } });
    if (!put.ok) {
      setStatus("Upload failed. Please try again.");
      return;
    }
    setStatus("Uploaded to staging. Promoting to masters...");
    const promoteRes = await fetch(API_BASE + "/api/promote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stagingKey: key })
    });
    if (!promoteRes.ok) {
      setStatus("Promotion failed. Please contact support.");
      return;
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
