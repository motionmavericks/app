# Performance Budget & Tactics

Budgets
- First load JS ≤ 170 kB; route chunk ≤ 70 kB; CLS < 0.1; LCP < 2.5s.

Tactics
- Route-based code splitting; dynamic imports for player/annotation.
- RSC for lists; stream responses; prefetch on hover.
- Memoize heavy components; virtualization for long lists.

Diagnostics
- Lighthouse CI; Next analyze; React Profiler for interactions.
