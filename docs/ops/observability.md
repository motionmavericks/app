# Observability

SLIs/SLOs
- Playback success rate ≥ 99.5%, preview latency p95 ≤ 10s (first build), cache hit ≥ 70%.

Metrics
- Cache hit ratio/fill, GPU queue depth, preview build duration, Wasabi egress by bucket, DB qps.

Logs/Traces
- Correlate request → asset → job. Keep 30–90 days.

Alerts
- Cache ≥ 85%, job failures > 2%/5m, 5xx > 1%/5m, egress spike > 2× baseline.
