# Deploy Checklist

Pre-reqs
- Wasabi buckets ready: `mm-staging-au`, `mm-masters-au` (Object Lock), `mm-previews-au`
- Secrets in DO App: Wasabi creds, `EDGE_SIGNING_KEY` (if edge), DB/Redis
- Managed Postgres created; URL set as `POSTGRES_URL`

Steps
- App Platform: `scripts/deploy_do_app.sh` (creates/updates app from `deploy/do-app.yaml`)
- Backend migration: `npm --prefix backend run migrate`
- Verify health: `GET /api/health` → `{ ok: true, db: true, redis: true }`
- Frontend loads; `/` shows assets (ISR 30s)
- Upload flow: presign → PUT to Staging → promote → worker builds → playback via `/play?p=...`

Edge (optional)
- Provision droplet; set env; run `node edge/dist/index.js`
- Set `EDGE_PUBLIC_BASE` and DNS for edge domain

GPU Workers (optional)
- Provision via `scripts/provision_gpu_worker.sh`
- Assign reserved IP via `scripts/gpu_reserved_ip.sh assign <ip> <droplet-id>`
- (Optional) Autoscale with `scripts/gpu_autoscaler.sh`

Post-Deploy
- Monitor logs & metrics
- Rotate keys on schedule; enforce branch protections
- Backups snapshot schedule confirmed for DB

