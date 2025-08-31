# Endpoint: Preview Events (SSE)

GET /api/preview/events?prefix=previews/<path>
- Content-Type: text/event-stream
- Emits `status` events with payload like `{ "ready": true|false }` until ready or timeout (~60s).

Behavior
- Best-effort polling on the server checks for the existence of `index.m3u8` under the prefix.
- Closes the stream after ready or after timeout.

Errors
- 400 missing prefix.

Acceptance
- Frontend can subscribe and update UI automatically when previews become available.
