# Threat Model

Assets to Protect
- Masters objects; credentials; share tokens; user data.

Threats
- Credential leakage; malicious uploads; hotlinking previews; privilege escalation; data deletion.

Mitigations
- Object Lock on masters; least‑privilege IAM and scoped keys; AV scan on staging; signed URLs at edge; RBAC enforcement; audit logs.

Abuse Controls
- Rate limits on presign/promote/share; captcha for public upload boxes; IP throttling on share views.

Monitoring
- Alert on unusual egress, failed auth spikes, repeated 403s, promotion failures.
