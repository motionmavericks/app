"use client";
import { useEffect, useRef, useState } from "react";

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AssetPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>("Loading...");
  const [prefix, setPrefix] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON(`${apiBase}/api/assets/${id}`);
        const latest = data.versions?.[0];
        const pref = latest?.preview_prefix || (latest?.master_key ? `previews/${latest.master_key.replace(/^masters\//, '')}` : null);
        setPrefix(pref);
        if (!pref) { setStatus("No preview prefix available yet"); return; }

        // Prefer SSE, fall back to polling
        let ready = data.ready === true;
        if (!ready && typeof window !== 'undefined' && 'EventSource' in window) {
          ready = await new Promise<boolean>((resolve) => {
            const es = new EventSource(`${apiBase}/api/preview/events?prefix=${encodeURIComponent(pref)}`);
            es.addEventListener('status', (ev) => {
              try { const d = JSON.parse((ev as MessageEvent).data); if (d.ready) { es.close(); resolve(true); } } catch {}
            });
            es.addEventListener('error', () => { es.close(); resolve(false); });
          });
        }
        if (!ready) {
          for (let i = 0; i < 15 && !ready; i++) {
            const st = await fetchJSON(`${apiBase}/api/preview/status?prefix=${encodeURIComponent(pref)}`);
            if (st.ready) { ready = true; break; }
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        if (!ready) { setStatus("Preview not ready yet"); return; }

        const signed = await fetchJSON(`${apiBase}/api/sign-preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ preview_prefix: pref }) });
        const v = videoRef.current as HTMLVideoElement;
        setStatus("Playing...");
        if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = signed.url; await v.play(); return; }
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          const hls = new Hls(); hls.loadSource(signed.url); hls.attachMedia(v); hls.on(Hls.Events.MANIFEST_PARSED, () => v.play());
        } else { setStatus("HLS not supported in this browser"); }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus(`Error: ${msg}`);
      }
    })();
  }, [id, apiBase]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Asset {id}</h1>
      <video ref={videoRef} controls className="w-full max-w-3xl bg-black" />
      <div className="mt-3 text-sm text-gray-600">{status}{prefix ? ` • ${prefix}` : ''}</div>
    </div>
  );
}
