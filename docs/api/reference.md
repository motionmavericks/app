# API Reference (outline)

Auth
- Session (Auth.js), OAuth providers; role checks per project.

Endpoints (sketch)
- `POST /api/presign` — get multipart URLs for staging.
- `POST /api/promote` — promote to masters; returns manifest row.
- `POST /api/preview` — enqueue preview build.
- `GET /api/assets/:id` — asset + versions + metadata.
- `POST /api/shares` — create share links.

Rate Limits
- Default 60 req/min per IP; stricter for share creation.
