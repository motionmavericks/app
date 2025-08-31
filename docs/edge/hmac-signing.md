# Edge HMAC Signing

Purpose
- Protect preview URLs by requiring a signed, expiring token before the edge proxies to Wasabi Previews.

Scheme
- Query params: `?exp=<unix-seconds>&sig=<hex>`
- Signature: `sig = hex(hmac_sha256(EDGE_SIGNING_KEY, path + "?exp=" + exp))`
- Validation: `now < exp` and `recompute(sig) == sig`

Backend
- Generate URLs for playback using this scheme. Include the full path to the preview object (e.g., `/previews/asset/<id>/index.m3u8`).

Edge
- Verify signature and `exp` before proxying. Implement as a small Node service that streams from Wasabi while preserving Range headers (preferred) or issue a redirect.

Notes
- Keep `exp` short (e.g., 10 minutes). Rotate `EDGE_SIGNING_KEY` periodically.
