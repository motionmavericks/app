Summary
- Cleaned and structured GitHub Actions: fixed corrupted CI, added per-service jobs gated by path filters; hardened deploy with concurrency and correct DOCR tag gating; kept secrets preserved via live spec.

Why This Plan Won
- Highest score for correctness/feasibility/security; minimal YAML edits that meaningfully reduce risk and noise while deploying only what changed.

Prereqs
- Tools: `doctl`, `yq`, `gh`, `jq` installed and authenticated.
- Env: `DO_ACCESS_TOKEN` (for doctl action), `GITHUB_TOKEN` (provided by Actions).

Steps
- Fix CI (done): `.github/workflows/ci.yml` uses `dorny/paths-filter` and splits jobs per service with npm cache.
- Harden deploy (done): `.github/workflows/do-app-deploy.yml` adds `concurrency`, fixes DOCR repo names in tag gating, and prints gates.
- Keep build/push selective (already present): `.github/workflows/docker-build-push.yml` builds only changed services and tags `latest` + `sha-${GITHUB_SHA}`.
- Validate end-to-end:
  - Push a commit touching only `worker/` → CI runs worker job only; build-push builds worker; deploy updates worker tag if the sha tag exists.
  - Watch: `gh run watch $(gh run list --workflow deploy-do-app --limit 1 --json databaseId --jq '.[0].databaseId') --interval 5 --exit-status`.

Testing
- PR touching backend only → only backend CI job runs.
- Dispatch `deploy-do-app` with `worker_only=true` and a known worker `sha-*` tag → only worker image tag is updated; secrets preserved.

Risks & Mitigations
- Risk: DOCR namespace changes → gating fails. Mitigation: update namespace in workflow (single place).
- Risk: Path filters miss a file. Mitigation: broaden globs and document.

Rollback
- Revert changes to `.github/workflows/ci.yml` and `.github/workflows/do-app-deploy.yml` to previous commit.

Estimate
- Time: 30–45 minutes to implement/validate.
- Cost: $0.
