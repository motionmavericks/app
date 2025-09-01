# Buckets & Lifecycle

Masters (immutable)
- Purpose: full‑resolution camera masters and finals only.
- Controls: Versioning + Object Lock (governance), MFA delete.
- Path: `clients/<client>/<project>/<yyyy-mm-dd>/<collection>/<asset-id>/<version-sha>/master.<ext>`
- Region: `ap-southeast-2` (same as Wasabi account)

Previews (expirable)
- Purpose: HLS + low MP4, content‑addressed by `version-sha`.
- Lifecycle: default expire after 365 days (configurable); abort incomplete multipart uploads after 3 days.
- Path: `hls/<sha>/manifest.m3u8`, `mp4/<sha>.mp4`.

Staging (temporary)
- Purpose: client uploads, C2C, NAS agent. AV scan + checksum.
- Lifecycle: auto‑delete after 7 days; abort incomplete multipart uploads after 3 days.

Docs (long‑term)
- Purpose: briefs, contracts, boards.
- Lifecycle: 5–7 years (configurable).

Backups (long‑term)
- Purpose: database dumps, manifests, audit logs.
- Lifecycle: retain daily 30d, weekly 12w, monthly 24m.

Examples
```
masters/clients/cadbury/projects/tour/2024-11-03/01-footage/A001C003/2a…e/master.braw
previews/hls/2a…e/manifest.m3u8
staging/uploads/0b1a…/myfile.mov
```

Naming Rules
- `client` and `project` are kebab‑case ASCII slugs.
- `asset-id` is a stable UUIDv7; `version-sha` is a sha256 hex.

Motion Mavericks (AU) — Bucket Plan
- Region: `ap-southeast-2`
- Endpoint: `https://s3.ap-southeast-2.wasabisys.com`
- New buckets for this application:
  - `mm-staging-au`
  - `mm-masters-au`
  - `mm-previews-au`

Data Safety Policy
- Do not alter or delete any existing production buckets or data; treat current production as read-only.
- Create and use the new buckets above for all MVP operations.
- Apply least-privilege IAM: separate keys for staging PUT, masters COPY, previews WRITE/READ.
- Enable Object Lock default retention on Masters at bucket creation time.
- Default encryption: enforce SSE-S3 (AES256) per object from the application; also enable bucket‑level default encryption in Wasabi Console.
- Public access: block public access at the bucket level in Wasabi Console; the application only issues signed URLs (Edge HMAC or presigned S3).

Automation
- Use `scripts/wasabi_buckets.sh` to idempotently create and configure buckets with versioning, lifecycle, and (for new Masters) Object Lock.
- Notes:
  - Some Wasabi regions may not accept `PutPublicAccessBlock` / `PutBucketEncryption` via API; set these in Console if API rejects.
  - Object Lock can only be enabled when creating a new bucket; to add it later, migrate to a new Masters bucket created with Object Lock enabled.
