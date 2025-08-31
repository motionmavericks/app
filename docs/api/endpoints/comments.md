# Endpoint: Comments

POST /api/assets/:id/comments
- Input: `{ timecode, body }`

PATCH /api/comments/:id
- Input: `{ body? , resolvedAt? }`

DELETE /api/comments/:id

WebSocket: `/ws/comments?assetId=...`
- Events: `created/updated/deleted` with payloads.
