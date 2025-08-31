# Endpoint: Get Asset

GET /api/assets/:id
- Output: `{ asset, versions[], metadata, shares[] }`

Query
- `?include=comments,sidecars` optional.

Errors
- 404 not found; 403 unauthorized.

Acceptance
- Returns latest version first; metadata includes EBUCore JSON.
