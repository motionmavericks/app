# Endpoint: Get Asset

GET /api/assets/:id
- Output: `{ asset, versions[], ready }`

Behavior
- Returns asset row and versions (latest first).
- Field `ready` reflects whether `index.m3u8` exists under the latest version's `preview_prefix`.

Errors
- 404 not found; 403 unauthorized.

Acceptance
- `ready` toggles to true shortly after preview build completes.
