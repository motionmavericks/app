# Auth & Roles

Auth
- Auth.js; session cookie; CSRF on POST.

Roles
- admin, editor, reviewer, viewer — scoped per project via membership table.

Policies
- Promote: editor+; Shares: editor+; Comments: reviewer+; Playback: viewer+ with access.

Acceptance
- Unauthorized requests return 403; share tokens bypass auth but enforce policy.
