# DigitalOcean Deployment

- App Spec: `deploy/do-app.yaml`
- Prereqs: `doctl auth init`, a DO project, Managed Postgres, Managed Redis, Wasabi credentials/buckets.

Steps
- Edit domains in spec (e.g., `api.example.com`) and env placeholders.
- Create app: `doctl apps create --spec deploy/do-app.yaml`
- Or update: `doctl apps update <APP_ID> --spec deploy/do-app.yaml`
- Configure secrets via App Platform UI or env entries in the spec for: Wasabi keys, EDGE_SIGNING_KEY.

MCP
- Use the DigitalOcean MCP server (via `scripts/mcp_digitalocean.sh`) from Codex to inspect apps and components during rollout.
- Ensure `doctl auth init` or `DIGITALOCEAN_ACCESS_TOKEN` is set.

Notes
- Frontend listens on 3001; Backend on 3000. App Platform handles routing via domains/paths.
- Worker runs as a long-running service consuming Redis Streams.
- Edge cache is optional for MVP; fallback presign works. For production, deploy edge on a Droplet with NVMe; configure using `edge/.env.example`.

Post-Deploy Validation
- Frontend responds at your domain.
- Backend `GET /health` returns `{ ok: true }`.
- Presign flow returns a valid PUT URL and upload succeeds to Staging bucket.
