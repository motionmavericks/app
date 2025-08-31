# MVP Acceptance Criteria

Functional
- Upload to staging; promotion to masters with Object Lock; preview available.
- Dashboard lists assets; asset page plays HLS; timecoded comments; share link.

Performance
- First playback after promotion p95 ≤ 60s; subsequent starts p95 ≤ 1.5s.

Security
- Masters immutable; signed URLs enforced; RBAC for projects.

Reliability
- Backups configured and tested; observability dashboards active.

Docs & Ops
- All docs current; runbooks tested; CI passes; docker-compose runs locally.
