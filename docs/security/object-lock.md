# Immutability with Object Lock

Mode
- Bucket versioning enabled; Object Lock in Governance mode for masters.

Defaults
- Set a default retention (e.g., 365 days) and allow per‑object overrides.

Workflow
1) Promotion copies object into masters and sets `retain-until-date`.
2) No component can delete or overwrite current versions until expiry.

Recovery
- Use replication and checksums to validate integrity. Keep backup manifests in a separate account/bucket.

Checklist
- [ ] Versioning enabled
- [ ] Object Lock enabled (bucket level)
- [ ] Default retention policy set
- [ ] MFA delete required for privileged ops
