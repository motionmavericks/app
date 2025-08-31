# Dashboards

Panels
- Queue: depth, age, success/failure rate.
- Cache: hit ratio, fill %, fetch latency.
- Playback: 2xx/4xx/5xx, TTFB, start render, stalled events.
- Storage: Wasabi egress by bucket; bytes written; API errors.
- DB: QPS, slow queries, connections.

Alerts
- Queue age > 5m; cache hit < 50%; 5xx > 1%/5m.
