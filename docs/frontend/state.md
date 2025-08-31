# Client State Strategy

Global
- auth/session, theme, toasts.

Query Cache (TanStack)
- Keys: `['assets', id]`, `['projects', id]`, `['comments', assetId]`, `['shares', id]`.
- Invalidate on mutations; staleTime tuned per resource.

URL State
- filters, sort, collection path; persist in querystring.

Optimistic Updates
- comments create/resolve; selection state; share create.

Acceptance
- Page reload preserves filters; offline share view loads from URL only.
