# IAM Roles & Policies

Principles
- Least privilege; masters are write‑once (promotion service only). Previews never written to masters.

Roles
- `uploader`: Put to staging only.
- `promoter`: Get staging; Put masters; no DeleteObject.
- `gpu-writer`: Get masters; Put previews.
- `edge-reader`: Get previews only.
- `backup-writer`: Put backups only.
 - `docs-writer`: Put to docs only.

Denies
- Explicitly deny any PutObject to `masters/*` for non‑promoter roles.
- Deny DeleteObject on `masters/*` globally (Object Lock adds protection).
 - Deny PutObject from any role to `previews/*` except `gpu-writer`.

Credentials
- Scoped access keys per service; rotated every 90 days; no long‑lived on hosts.
