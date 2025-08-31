"use client";
import { useEffect, useRef, useState } from "react";

function useQueryParam(name: string) {
  if (typeof window === "undefined") return undefined as string | undefined;
  return new URLSearchParams(window.location.search).get(name) || undefined;
}

export default function PlayPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>("Loading...");
  const prefix = useQueryParam("p");
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  useEffect(() => {
    (async () => {
      if (!prefix) { setStatus("Missing ?p=<preview_prefix>"); return; }
      try {
        const res = await fetch(`${apiBase}/api/sign-preview`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ preview_prefix: prefix }) });
        if (!res.ok) throw new Error(await res.text());
        const { url } = await res.json();
        setStatus("Playing...");
        const v = videoRef.current as HTMLVideoElement;
        if (v.canPlayType('application/vnd.apple.mpegurl')) {
          v.src = url;
          await v.play();
          return;
        }
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(v);
          hls.on(Hls.Events.MANIFEST_PARSED, () => v.play());
        } else {
          setStatus("HLS not supported in this browser");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus(`Error: ${msg}`);
      }
    })();
  }, [prefix, apiBase]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Player</h1>
      <video ref={videoRef} controls className="w-full max-w-3xl bg-black" />
      <div className="mt-3 text-sm text-gray-600">{status}</div>
    </div>
  );
}
