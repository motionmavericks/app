# Endpoint: Preview Callback

POST /api/preview/callback
- Input:
```
{
  "asset_id": "optional-uuid",
  "preview_prefix": "asset/<id>/default",
  "ok": true
}
```
- Output: `{ ok: true }`

Behavior
- Worker notifies backend when preview artifacts are uploaded.
- Backend may update database state and emit notifications.

Errors
- 400 validation error.

Acceptance
- Returns `{ ok: true }` and logs the callback.
