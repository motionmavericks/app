# API Reference (outline)

Auth
- Session (Auth.js), OAuth providers; role checks per project.

Endpoints (sketch)
- `POST /api/presign` — get multipart URLs for staging.
- `POST /api/promote` — promote to masters; returns manifest row.
- `POST /api/preview` — enqueue preview build.
- `POST /api/sign-preview` — sign edge playback URL or return presigned fallback.
- `GET /api/assets/:id` — asset + versions + metadata.
- `GET /api/preview/status` — readiness flag for a preview prefix.
- `GET /api/preview/events` — SSE stream of readiness for a preview prefix.
- `POST /api/shares` — create share links.

Rate Limits
- Default 60 req/min per IP; stricter for share creation.
