# Edge Cache Service

Purpose
- Cache HLS playlists/segments close to users; proxy to Wasabi Previews.

Deployment
- Provision a Droplet with NVMe storage on DigitalOcean (same region as backend if possible).
- Use `edge/nginx.conf` or `edge/Caddyfile` as a starting point.
- Configure environment via `edge/.env.example` and systemd service.
- Restrict egress to the Previews bucket endpoint.

Security
- Require HMAC signed URLs (generated in backend) before allowing proxy.
- HMAC validation is implemented in the Fastify application layer.
- The reverse proxy (Caddy/Nginx) only forwards requests that have already been validated.

Notes
- Ensure `Range` headers are supported and not stripped.
- Monitor cache hit ratio and disk usage; size per `CACHE_MAX_BYTES`.
