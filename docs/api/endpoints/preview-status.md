# Endpoint: Preview Status

GET /api/preview/status?prefix=previews/<path>
- Output: `{ ready: boolean }`

Behavior
- Checks if `index.m3u8` exists under the given preview prefix in the Previews bucket.

Errors
- 400 missing prefix.

Acceptance
- Returns `{ ready: true }` once the worker has uploaded the HLS playlist.
