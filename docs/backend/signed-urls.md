# Signed URLs

Purpose
- Gate access to previews at edge; prevent hotlinking.

Token
- HMAC SHA256 over `{path}?exp&sha&variant` with secret `EDGE_SIGNING_KEY`.
- TTL: 10 minutes default (configurable 5–30).

Validation
- Edge recomputes HMAC; rejects if expired or mismatched sha/variant.

Acceptance
- Links expire and cannot be reused after TTL; clock skew tolerated ±60s.
