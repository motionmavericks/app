# Edge Cache (NVMe)

Design
- Serve previews from local NVMe for instant seek/scrub. Hydrate from previews bucket on miss.

Policy
- Size cap (e.g., 600 GB); LRU + TTL (90 days) trim.
- Atomic writes: `.part` → rename; integrity via sha256 for manifest.

Runbook
- Trim: `cache-trim --max-bytes=600GB`
- Inspect: `cache-index ls --bytes --last-access`

Observability
- Metrics: hit ratio, fill %, fetch latency, 5xx rate.
