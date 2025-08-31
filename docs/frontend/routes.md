# Routes & Layout

App Router Map
```
/                      → Dashboard (grid)
/upload               → Upload to staging (dev tool)
/play                 → HLS player (query `?p=<preview_prefix>`)
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
