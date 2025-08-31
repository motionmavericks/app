# Runbook: Edge Cache Full

Symptoms
- 5xx on preview fetch; logs show ENOSPC.

Actions
1) `cache-index stats` — confirm fill %.
2) `cache-trim --target-util=70` — trim LRU.
3) Verify: re-request preview.

Prevention
- Lower TTL or raise NVMe size cap.
