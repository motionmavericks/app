# Migration Plan (Legacy → New Masters)

Inputs
- Legacy buckets: `ice-mavericks` (archive), selected `mirror-mavericks` paths.
- Inventory: `wasabi_audit.json`.

Phases
1) Index & map: infer client/project/date/collection; produce CSV manifest.
2) Dry‑run: review overrides; lock mapping.
3) Copy: server‑side copy to `masters/*` with Object Lock; write checksums.
4) Validate: size match + spot‑check SHA256; report.
5) Cutover: point app to new masters; keep legacy read‑only.

Acceptance
- No deletions; manifest contains src, dest, bytes, sha256, lastModified.
