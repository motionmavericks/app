Next Actions
- Push a commit touching only the needed service (e.g., worker) to verify selective CI and build-push.
- Dispatch deploy: `gh workflow run deploy-do-app -f worker_only=true -f sha=$(git rev-parse HEAD)`.
- Watch: `gh run watch $(gh run list --workflow deploy-do-app --limit 1 --json databaseId --jq '.[0].databaseId') --interval 5 --exit-status`.
- Confirm only the intended image tag updated; secrets preserved (live spec based).
- If gating fails, update DOCR namespace in `.github/workflows/do-app-deploy.yml`.
