# Edge AGENTS.md

Purpose
- Guide agents contributing to the edge proxy/cache: HMAC signing, path sanitization, range/headers, timeouts, and rate limiting.

Run
- Dev: `make edge-dev` (http://localhost:8080)
- Build: `make edge-build`

Routes
- `GET /health`: returns `{ ok: true }`
- `GET /s/*`: validates `exp`+`sig`, sanitizes path, proxies to Wasabi Previews with Range support

Environment
- `EDGE_SIGNING_KEY` (≥32 chars; HMAC secret)
- `PREVIEWS_BUCKET`, `WASABI_ENDPOINT`, `WASABI_REGION`
- Limits/timeouts: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`, `FETCH_TIMEOUT_MS`

Security
- Path sanitization: only allow `[A-Za-z0-9._\-/]`
- Constant‑time signature compare; reject expired tokens
- No access to Masters

Testing
- Unit tests in `edge/tests` (Vitest) for signing helpers

Do/Don’t
- Do: preserve Range and relevant headers; log request metadata
- Don’t: expose internals; no directory traversal; no public endpoints without signature

