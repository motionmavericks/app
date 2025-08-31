# Runbook: Failed Promotion

Symptoms
- `POST /api/promote` 5xx; manifest row missing; no object in masters.

Actions
1) Re-run with idempotency key; check size/sha256.
2) Validate IAM allows PutObject with Object Lock headers.
3) Check staging object existence; retry copy server‑side.

Prevention
- Retries with exponential backoff; circuit breaker on Wasabi errors.
