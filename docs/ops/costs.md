# Cost Management

Levers
- Keep masters only in Wasabi; previews in TTL bucket + NVMe cache.
- Limit preview ladder; precompute only for hot assets.

Budgets
- Track storage TB, egress GB (masters vs previews), GPU hours.

Policies
- Previews TTL 60–90d; staging TTL 30–60d; cache size cap with LRU.
