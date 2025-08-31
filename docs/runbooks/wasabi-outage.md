# Runbook: Wasabi Outage / Degraded

Impact
- Promotions fail; preview builds from masters fail; existing previews still serve from cache.

Actions
1) Pause promotions and GPU builds; keep edge serving cached previews.
2) Communicate status; enable read‑only mode.
3) When restored, resume queues; verify backlog processing.

Prevention
- Consider cross‑region replication for masters; edge caches sized for N hours of traffic.
