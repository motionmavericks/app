# Component Spec: Comments

Purpose
- Timecoded comment threads with mentions and resolve state.

Data
- `comment { id, assetId, versionSha, timecode, body, author, createdAt, resolvedAt? }`

Behaviors
- Jump to timecode; add at current playhead; @mention with suggestions.
- Resolve/unresolve; filter by unresolved.

Accessibility
- Keyboard submit; focus management; aria-live updates.

Acceptance
- Comment create/edit/delete; jump seeks player; real-time updates via WebSocket.
