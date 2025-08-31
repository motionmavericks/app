# Runbook: GPU Backlog

Symptoms
- Preview jobs queue depth grows; build latency > SLO.

Actions
1) Scale workers: increase replicas or spin up DO GPU droplets.
2) Prioritize: move hot assets to priority queue.
3) Inspect failures: retry with backoff; capture ffmpeg logs.

Prevention
- Autoscale by queue depth/age; precompute for trending assets.
