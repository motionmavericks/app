# Frontend Architecture

Goals & Constraints
- Fast, responsive review UI with reliable playback and collaboration.
- Dark-first UI, accessible (WCAG AA), keyboard navigable.
- SSR where beneficial; minimize bundle size; offline-friendly sharing pages.

Stack
- Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui.
- State/Data: Server Components + Server Actions; TanStack Query for client cache; Zod for schemas.
- Player: hls.js for VOD HLS; WebVTT captions; canvas overlay for annotations.

App Structure (monorepo)
```
frontend/src/
  app/
    (dashboard)/page.tsx            # grid view
    projects/[projectId]/page.tsx   # project overview
    assets/[assetId]/page.tsx       # asset detail + player
    shares/[token]/page.tsx         # public share view
  components/
    dashboard/                      # topbar, sidebar, toolbar, cards
    player/                         # HLSPlayer, Controls, Timeline, Captions
    review/                         # CommentList, AnnotationCanvas
  lib/
    api.ts                          # client helpers (fetchers)
    auth.ts                         # Auth.js client helpers
    utils.ts                        # general utils
```

Routing & Pages
- Dashboard: filter/sort/search assets; infinite grid; keyboard selection.
- Project: collections tree (00‑project, 01‑footage, 02‑audio, 03‑graphics, 00‑exports); stats.
- Asset: video player (HLS), metadata panel (EBUCore), versions stack, comments + annotations.
- Share: lightweight page with watermark overlay; password prompt when required.

Data Fetching Strategy
- Server Components for data-heavy lists; cache tags by resource (e.g., `asset:${id}`); revalidate on mutations.
- Server Actions for mutations (comment, resolve, promote request, share create).
- TanStack Query for client-side live updates (comments stream, selection state).

State Management
- Global: auth/session, theme.
- Per‑view: selection (grid), playback state (timecode, paused), drafts (comment text).
- URL state: filters, sort, collection path.

Player Architecture
- hls.js attached to `<video>`; MP4 fallback.
- Controls: play/pause, step ±1 frame, speed, volume, captions, timecode display.
- Overlays: AnnotationCanvas renders vector shapes tied to time ranges; thumb scrubbing uses preview sprites if available.

Forms & Validation
- react-hook-form + Zod; server-side validation mirrors Zod schema.

Auth & Permissions
- Auth.js (email/OAuth). Session cookie; server-side reads perform authorization checks against project membership/role.
- Client gates hide actions; server is the source of truth.

Error Handling
- Error boundaries per route; toast + retry for transient failures; redirect on 401.

Performance
- Code‑split heavy panels (player, metadata) via dynamic import; prefetch on hover.
- Use RSC for grids; stream results; skeletons + optimistic UI for comments.

Accessibility & i18n
- Labels for controls; focus traps in dialogs; ARIA roles for lists and players; keyboard bindings for JKL/arrow.
- i18n ready via translation layer (later); copy keys scoped per feature.

Testing
- Unit: component logic (controls, forms).
- Integration: page interactions with MSW.
- E2E: Playwright scenarios (upload → promote → preview → comment → share).

Config
- Env: `NEXT_PUBLIC_EDGE_BASE`, `NEXT_PUBLIC_PREVIEW_SIGNING`, feature flags (annotations, transcription).

Security
- Never expose Wasabi credentials; previews accessed via signed URLs from backend; sanitize user content (comments).
