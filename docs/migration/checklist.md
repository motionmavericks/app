# Migration Checklist (Pilot)

Prep
- [ ] Confirm new buckets + IAM in ap-southeast-2.
- [ ] Lock legacy buckets read-only during copy windows.

Inventory
- [ ] Run indexer; produce CSV with `src, dest, bytes, sha256, lastModified`.
- [ ] Review mapping overrides; freeze manifest.

Copy & Validate
- [ ] Copy with retention headers; log manifest ids.
- [ ] Validate sizes; spot-check sha256; compare counts.

Cutover
- [ ] Update app to point project to new masters paths.
- [ ] Enable preview builds; warm hot assets.

Sign-off
- [ ] Stakeholder review; update docs & runbooks.
