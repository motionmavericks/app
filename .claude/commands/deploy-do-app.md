# Deploy DO App

Coordinate CI workflows for DigitalOcean App Platform and validate spec/logs with strict guardrails. This command is routed to `@deployment-orchestrator` and follows MCP‑first policies for diagnostics.

Use:
- Orchestrator: @.claude/agents/deployment-orchestrator.md
- DO Deploy Guide: docs/deploy/digitalocean.md

Preconditions (Spec Hygiene)
- DOCR images: when `registry_type: DOCR`, omit `image.registry`; set only `repository` and `tag`.
- Backend image tag pinned to `sha-${GITHUB_SHA}` in CI via `yq`.
- Secrets are managed in the live App; avoid wiping by editing only image tags on update.

CI Flow (triggered outside this command)
1) build-push-docr → builds images and pushes to DOCR
2) deploy-do-app → applies `deploy/do-app.yaml` with pinned tags

CI Watch Helpers
- Last build: `gh run watch $(gh run list --workflow build-push-docr --limit 1 -q '.[0].databaseId') --interval 5 --exit-status`
- Last deploy: `gh run watch $(gh run list --workflow deploy-do-app --limit 1 -q '.[0].databaseId') --interval 5 --exit-status`

Validation Checklist
- Spec sanity: `yq eval '.services[] | {name: .name, image: .image}' deploy/do-app.yaml`
- Dry update: `doctl apps update "$APP_ID" --spec deploy/do-app.yaml --wait` (validate only varies by doctl)
- Deploy logs: `doctl apps logs "$APP_ID" backend --type deploy --tail 200`
- Worker logs: `doctl apps logs "$APP_ID" preview-worker --type run --tail 200`

Guardrails
- Production deploys go via CI only. Use DigitalOcean MCP for inspection/logs in dev/staging, not for prod changes.
- Prefer `yq/jq` for YAML/JSON edits; output unified diffs limited to `deploy/do-app.yaml` and CI workflow files.
- Hard‑fail on drift; do not modify unrelated files or secrets blocks.

Typical Slash Usage
- "/deploy-do-app: validate spec and watch deploy run; if failing, surface DO logs and suggest fixes limited to do-app.yaml and deploy workflow"

What This Command Produces
- A short report including: CI run URLs/status, spec validation output, any DO logs snippets, and a minimal diff proposal if a narrow spec fix is required.

Canonical Prompt (Claude → targeted diff)
- "Modify ONLY deploy/do-app.yaml and .github/workflows/do-app-deploy.yml. Ensure DOCR image blocks omit image.registry, and pin backend image.tag to sha-${GITHUB_SHA} with yq. Output unified diffs for those two files only + a 3-line Validation (doctl/yq)."

Failure Triage Flow
- If CI deploy fails: fetch logs via DO MCP or `doctl apps logs <APP_ID> backend --type deploy --tail 200` and include last 50 lines.
- Identify spec or workflow drift; propose a minimal unified diff limited to `deploy/do-app.yaml` and the deploy workflow.
- Re-run spec sanity `yq` command above and include the output in the report.
