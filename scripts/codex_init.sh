#!/usr/bin/env bash
set -euo pipefail

echo "== Codex /init =="
echo "repo: $(basename "$(pwd)")"; echo

# Ensure local bin on PATH for helper installs (yq/doctl installers may use it)
export PATH="$(pwd)/bin:$PATH"
mkdir -p bin

have() { command -v "$1" >/dev/null 2>&1; }

echo "-- Tooling --"
for t in rg jq git node npm doctl gh yq; do
  if have "$t"; then printf "%-6s %s\n" "$t" "$($t --version 2>/dev/null | head -n1)"; else printf "%-6s %s\n" "$t" "(missing)"; fi
done
echo

echo "-- Repo quick map --"
printf "%-20s %s\n" frontend/ "Next.js app" \
                   backend/  "Fastify API" \
                   worker/   "Preview worker" \
                   edge/     "Edge signer/proxy" \
                   deploy/   "App Platform spec" \
                   .github/  "CI build/deploy" \
                   docs/     "Architecture & runbooks"
echo

echo "-- CI workflows --"
if [ -f .github/workflows/build-push-docr.yml ] || [ -f .github/workflows/docker-build-push.yml ]; then
  echo "build-push-docr: present"
else
  echo "build-push-docr: (missing)"
fi
if [ -f .github/workflows/do-app-deploy.yml ]; then
  echo "deploy-do-app: present"
else
  echo "deploy-do-app: (missing)"
fi
echo

echo "-- DO App spec checks --"
if [ -f deploy/do-app.yaml ]; then
  # Show service and worker names without leaking values
  awk 'NR==1,NR==300{print}' deploy/do-app.yaml >/dev/null
  echo "deploy/do-app.yaml: present"
  if have yq; then
    yq '.services[].name' deploy/do-app.yaml 2>/dev/null | sed 's/^/service: /' || true
    yq '.workers[].name'  deploy/do-app.yaml 2>/dev/null | sed 's/^/worker:  /' || true
  fi
else
  echo "deploy/do-app.yaml: (missing)"
fi
echo

echo "-- Env expectations --"
echo "backend: POSTGRES_URL, REDIS_URL, WASABI_* (endpoint/region/keys), buckets, EDGE_SIGNING_KEY, EDGE_PUBLIC_BASE"
echo "worker:  REDIS_URL, WASABI_* (masters/previews), buckets, PREVIEW_PRESET, HLS_SEGMENT_SEC"
echo "frontend: NEXT_PUBLIC_API_BASE, NEXT_PUBLIC_EDGE_BASE"
echo

echo "== Tips =="
echo "- Push to main triggers: build-push-docr → deploy-do-app (pinned backend tag)."
echo "- Watch CI: gh run watch \$(gh run list --workflow deploy-do-app --limit 1 --json databaseId --jq '.[0].databaseId') --interval 5 --exit-status"
echo "- DO logs: doctl apps logs <APP_ID> backend --type deploy --tail 200"
echo "          doctl apps logs <APP_ID> preview-worker --type run --tail 200"
echo "- Health:  curl https://<DefaultIngress>/api/health"

echo
echo "Init complete."
