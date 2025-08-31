# Routes & Layout

App Router Map
```
/                      → Dashboard (grid)
/projects/[id]         → Project overview
/assets/[id]           → Asset detail/player
/shares/[token]        → Public share
/admin                 → Settings
```

Layouts
- Root: topbar + grid layout; sidebar persisted.
- Asset: three-pane (player | metadata | comments) with resizable panels.

Loading/Error States
- Skeletons for grid cards; player shows poster + spinner; retry CTA.
