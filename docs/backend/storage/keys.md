# Storage Keys & Metadata

Masters
- `clients/<client>/<project>/<yyyy-mm-dd>/<collection>/<asset-id>/<sha>/master.<ext>`
- Metadata: `sha256`, `bytes`, `uploaded-by`, `created-at`, `original-name`.

Previews
- `hls/<sha>/manifest.m3u8`, `hls/<sha>/seg-%04d.ts`, `mp4/<sha>.mp4`.
- Metadata: `source-sha`, `built-at`, `preset`, `watermark`.

Staging
- `uploads/<uuid>/<filename>`; auto‑expire.
