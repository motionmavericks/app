# Service: Web/API

Responsibilities
- Auth/session; presign; promotion orchestration; share management; comments API; signed URL issuance.

Non‑Responsibilities
- Transcoding; cache serving; long‑running jobs.

Key Modules
- auth, presign, promote, signer (HMAC), shares, comments, assets.

Observability
- Structured logs, request tracing; metrics for latency and error rate.
