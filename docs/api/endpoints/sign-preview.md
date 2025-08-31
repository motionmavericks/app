# Endpoint: Sign Preview URL

POST /api/sign-preview
- Input:
```
{
  "preview_prefix": "previews/asset/<id>",
  "playlist": "index.m3u8",     // optional
  "expSec": 600                  // optional
}
```
- Output:
```
{ "url": "https://edge.example.com/s/previews/asset/<id>/index.m3u8?exp=...&sig=...", "edge": true, "exp": 1712345678 }
```

Behavior
- If `EDGE_PUBLIC_BASE` and `EDGE_SIGNING_KEY` are set, returns an HMAC‑signed edge URL for playback.
- Otherwise, returns a presigned Wasabi Previews GET URL as a fallback.

Errors
- 400 validation error; 501 not configured.

Acceptance
- Returns a working URL that plays HLS in the player.
