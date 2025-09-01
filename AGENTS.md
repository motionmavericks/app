# Agents Guide (Codex CLI)

Purpose
- Equip AI agents and contributors with precise, repeatable practices for working in this repo using Codex CLI.
- Minimize friction: clear workflow, tools usage, formatting, validation, and security.

Quickstart
- Explore: `rg --files -n`, `rg "keyword"`, `ls -la`
- Run frontend: `make install && make dev` (http://localhost:3001)
- Build/Lint/Typecheck: `make build`, `make lint`, `make typecheck`
- Docs entry: `docs/index.md` (see Service Plan: `docs/architecture/services-plan.md`)
- AI-friendly tips: `docs/ai/codex-cli-guidance.md`
 - Qwen Code (agentic coder): `make qwen` (see `docs/ai/qwen-code.md`)
 - Service guides: `backend/AGENTS.md`, `worker/AGENTS.md`, `edge/AGENTS.md`, `frontend/AGENTS.md`

Repository Map (current)
- `frontend/`: Next.js app (App Router, Tailwind v4)
- `docs/`: Architecture, endpoints, ops, runbooks
- `tools/`: Utilities (e.g., `tools/wasabi_audit.py`)
- `Makefile`: top-level wrappers (`install`, `dev`, `build`, `lint`, `typecheck`, `test`, `clean`)

Repo overview (OpenAI Agents-inspired)
- Source: `backend/src`, `worker/src`, `edge/src`, `frontend/src`
- Tests: `backend/tests`, `edge/tests` (expand as needed)
- Docs: `docs/` (architecture/services/runbooks)
- Utilities: `Makefile`

Agent Workflow
- Be concise, direct, and friendly. Provide momentum with short preambles before tool calls.
- Prefer minimal, scoped changes; avoid touching unrelated areas.
- Always keep the user informed of the next immediate step.

Init
- Start a fresh Codex instance and run `/init` (or `make init`).
- `/init` executes `scripts/codex_init.sh` which:
  - Checks required tools (rg, jq, doctl, gh, yq) and prints versions.
  - Verifies presence of `deploy/do-app.yaml` and CI workflows.
  - Summarizes services/workers and reminds required envs.
  - Prints quick commands for CI watch, DO logs, and health.

Qwen + Codex Operating Model
- Qwen Code: Perform repo‑scale discovery, summarize architecture, propose diffs/tests/docs, and automate high‑level refactors.
- Codex (this agent): Convert human/Qwen inputs into precise action items and plans; implement minimal `apply_patch` changes; keep `/docs/` and env templates in sync; run `make typecheck`, `make lint`, `make build` to validate; orchestrate MCP tooling for deploys.
- Workflow: Run `make qwen` for exploration → paste summaries/proposals → Codex turns them into a task list → implement and validate.

Claude Code — Guardrails & Usage
- When to use: ambiguous/risky changes, YAML/spec surgery, CI/CD deploy fixes, targeted diffs.
- Guardrails (always):
  - Scope to specific files and outputs (unified diffs only + short Validation).
  - Hard‑fail on drift; do not let Claude modify unrelated files.
  - Prefer yq/jq over awk/sed for YAML/JSON edits.
- Canonical prompts (copy/paste):
  - DO App spec image parsing fix (DOCR):
    - For DOCR, omit `image.registry` (leave blank). Required fields: `registry_type: DOCR`, `repository`, `tag`.
    - Pin backend `image.tag` to `sha-\${GITHUB_SHA}` using yq in CI.
    - Example prompt:
      - `claude -p "Modify ONLY deploy/do-app.yaml and .github/workflows/do-app-deploy.yml. Ensure DOCR image blocks omit image.registry, and pin backend image.tag to sha-\${GITHUB_SHA} with yq. Output unified diffs for those two files only + a 3-line Validation (doctl/yq)." --max-turns 6`
  - CI watcher (don’t poll arrays incorrectly):
    - `gh run watch $(gh run list --workflow build-push-docr --limit 1 -q '.[0].databaseId') --interval 5 --exit-status`
    - `gh run watch $(gh run list --workflow deploy-do-app --limit 1 -q '.[0].databaseId') --interval 5 --exit-status`
- Validation checklist after applying Claude’s diffs:
  - `yq eval '.services[] | {name: .name, image: .image}' spec.yaml`
  - `doctl apps update "$APP_ID" --spec spec.yaml --wait` (validate-only varies by doctl version)
  - `doctl apps logs "$APP_ID" backend --type deploy --tail 200`


Docs Discipline (Always)
- Treat `/docs/` as the source of truth. Any code/config change must be reflected in the relevant docs before the task is done.
- Update env templates and `docs/configuration/env.md` together; add new variables to `.env.example` files and document them.
- When adding endpoints/features, update `docs/api/*` and link usage from `docs/dev-setup.md` or runbooks as needed.
- For deployment/runtime changes, update `deploy/*` and relevant service docs under `docs/backend/services/*` and `docs/architecture/*`.
- Prefer linking to specific doc files in your updates and summaries.

Planning (`update_plan`)
- Use when tasks are non-trivial or multi-phase.
- Keep steps short (≤7 words), one `in_progress` at a time.
- Update statuses as you progress; explain if the plan changes.

Preambles (before tool calls)
- One or two short sentences. Example: “Next, I’ll update env docs and link them.”
- Group related actions under one preamble when running several commands together.

Editing Files (`apply_patch`)
- Always use `apply_patch` to modify files. Do not write files via shell redirection.
- Patch grammar:
  - Add: `*** Add File: path` then prefix each line with `+`
  - Update: `*** Update File: path` followed by hunks
  - Delete: `*** Delete File: path`
- Keep changes minimal and focused on the requested task.
- Do not add license/copyright headers.
- Avoid inline code comments unless explicitly requested.

Shell Usage
- Prefer ripgrep: `rg` for search, `rg --files -n` for file listing.
- Read files in chunks ≤250 lines: `sed -n '1,200p' path` then continue if needed.
- Output truncation: keep command outputs small and relevant.
- Avoid destructive commands unless explicitly requested; never run `rm -rf` outside the workspace.

Formatting Output (final answers)
- Keep responses concise; use bullets when helpful.
- Use headers only when useful; 1–3 words, surrounded by `**`.
- Monospace for commands, paths, env vars, and code identifiers (e.g., `make build`, `ui/src/app/page.tsx`).
- File references: provide standalone clickable paths, optionally with `:line`.
- Don’t include ANSI escapes; the CLI styles output.

Repository Conventions
- Source lives in `src/` or app entry points in `app/` for Python; JS/TS lives under feature folders (here, the UI is under `ui/`).
- Tests in `tests/` mirror the source layout.
- Scripts: `scripts/` for helpers; config lives in dotfiles.
- Assets: `assets/` or `public/`; do not commit generated artifacts.

Build, Test, and Development
- Build: `make build`
- Dev: `make dev`
- Lint/Format: `make lint`
- Typecheck: `make typecheck`
- Test: `make test` (placeholder until tests are added in `ui/`)

Coding Style & Naming
- JS/TS: 2 spaces (Prettier/ESLint defaults). camelCase for functions/vars, PascalCase for components/classes.
- Python: 4 spaces. snake_case for functions/vars, PascalCase for classes.
- Prefer automated formatters/linters. CI should fail on style errors.

Testing Guidelines
- Frameworks: Jest/Vitest for JS/TS; pytest for Python.
- Layout: one test file per source module (e.g., `component.spec.ts`, `test_module.py`).
- Coverage: target ≥80% for changed code; add regression tests with bug fixes.
- Run: `npm test --silent` or `pytest -q` when present.

Commits & PRs (when applicable)
- Conventional Commits (e.g., `feat:`, `fix:`, `docs:`).
- Keep PRs small; include purpose, linked issues, acceptance checks, and any screenshots for UI.
- Update docs and `CHANGELOG` if present.

Security & Configuration
- Never commit secrets. Use `.env` and provide `.env.example` with placeholders.
- Use runtime env vars. For UI, only `NEXT_PUBLIC_*` are exposed to the browser.
- Pin dependencies where reasonable; address critical audit issues.

Data Safety (Wasabi)
- Treat existing production buckets as read-only. Do not alter or delete any production data during development or migration.
- Create new buckets for the MVP (`mm-staging-au`, `mm-masters-au`, `mm-previews-au`) in `ap-southeast-2` and wire least-privilege IAM per function.

Validation
- After changes to UI code: `make typecheck`, `make lint`, `make build`, and optionally `make dev` to verify HMR.
- After docs changes: ensure links resolve and commands are accurate/copy‑pasteable.

Do/Don’t Checklist
- Do: keep changes minimal; write plans for multi-step work; cross-link relevant docs; prefer wrappers (`make ...`).
- Do: use `rg` for search; read files in ≤250-line chunks.
- Don’t: add unrelated refactors; introduce new tools without documenting them; commit generated files.
- Don’t: leak secrets; modify files outside the workspace; change licenses.

Repo-Specific Notes
- Frontend dev server: http://localhost:3001
- Env example: `frontend/.env.example` (start with `NEXT_PUBLIC_EDGE_BASE`)
- Service inventory and connectivity: `docs/architecture/services-plan.md`
- Compose plan (draft): `docs/infra/compose.md`

**MCP Tools**
- Exa: web search and content lookup; prefer for web queries instead of ad‑hoc curl.
- Ref: documentation search and URL read; use for API/library docs before browsing.
- GitHub: repo, code, and issue searches across GitHub.
- Browserbase: cloud browser automation (navigate/extract/act) when page rendering is required.
- DigitalOcean: manage DO Apps/Droplets/Networking via MCP.
- DigitalOcean: manage DO Apps/Droplets/Networking via MCP.

Qwen Code Tooling
- Launch: `make qwen` (already integrated via npx). Authentication via Qwen OAuth or OpenAI‑compatible providers.
- Prefer Qwen for: large‑repo summarization, scaffolds/tests/docs generation, dependency graphs, changelogs, multi‑step git/file ops.
- Prefer Codex for: surgical patches, plans, validations, and MCP workflows.
- Docs: `docs/ai/qwen-code.md`.

Claude Code Tooling
- Launch: `make claude` (interactive). Non-interactive: `make claude-plan` and `make claude-audit-*`.
- Prefer Claude Code for: risky or ambiguous changes needing tight local feedback loops, codemods with nuance, polishing tests/runbooks.
- Docs: `docs/ai/claude-code.md`.

Codex × Claude Code — Who Does What
1) Repo-wide, parallel, mechanical work
- Codex: bulk refactors, mass lint/format, deps/security, codemods at scale, wide test generation, client regen, license/compliance, SAST/secret sweeps.
- Claude Code: validate risky bits locally, fix edge-case breakages, craft precise codemods, tighten failing tests.

2) CI/CD & release engineering
- Codex: pipelines/matrices/toolchains, PR templates/CODEOWNERS, automate versioning/changelogs.
- Claude Code: debug failing CI jobs locally, patch bespoke scripts/Dockerfiles, smoke-test RCs.

3) New feature scaffolding (multi-service)
- Codex: scaffold services, propagate schema changes, baseline tests/docs, open linked PRs.
- Claude Code: shape design, tricky business logic, iterate APIs, wire integrations, step through failing paths locally.

4) Migrations & platform changes
- Codex: framework/runtime migrations, config standardization, logging/telemetry rollouts, i18n plumbing.
- Claude Code: untangle service-specific quirks, performance-tune hot paths, rewrite complex middlewares, validate migrations.

5) Performance & reliability
- Codex: add tracing/metrics consistently, roll out retries/circuit breakers, widen timeouts, build load tests, open fix PRs.
- Claude Code: profile (flamegraphs), optimize algorithms/SQL, resolve racy concurrency, fix heisenbugs.

6) Documentation & developer experience
- Codex: keep READMEs/ADRs/docsite in sync, generate quickstarts, update examples repo-wide.
- Claude Code: polish guides/runbooks, improve CLI ergonomics/templates.

7) Security & governance
- Codex: rotate tokens (via vault), enforce branch protections, policy-as-code changes, fix obvious vuln advisories.
- Claude Code: review sensitive diffs, adjust least-privilege IAM, fix auth edge cases.

8) Data & schema work
- Codex: generate/sequence migrations, update ORM models, backfills/seeds, basic data checks.
- Claude Code: reason about irreducible schema changes, reversible migrations, prod safety checks with realistic datasets.

9) Frontend fleets
- Codex: bump design system, codemod component APIs across apps, ESLint/style rule fixes, snapshot updates.
- Claude Code: resolve tricky state/data fetching, accessibility fixes, perf (bundle splitting, memoization), pixel-perfect.

Handoff Patterns
- Spec → Sweep: Claude drafts small RFC + example diff → Codex executes repo-wide → Claude reviews & fixes edge cases.
- Bulk → Surgical: Codex lands mechanical PRs → Claude lands the 10–20% needing domain context.
- CI Fail → Local Fix: Codex reports failing jobs → Claude reproduces/fixes locally, pushes targeted PR.

Changelog
- 2025-09-01: Added service-level AGENTS.md files and overview links; aligned with OpenAI Agents guidance to keep instructions close to services.

**MCP Usage Policy**
- Prefer MCP tools over hand‑rolled HTTP when available (search, docs, GitHub, browsing).
- For browsing workflows, first try Ref/Exa to locate exact docs; escalate to Browserbase only when DOM interaction is needed.
- Keep actions atomic (navigate → extract → act) and narrate with short preambles.
- Respect approval policy; group related actions to minimize prompts.

**MCP Configuration**
- Config file: `/home/maverick/.codex/config.toml` (servers defined under `[mcp_servers.*]`).
- Browserbase requires `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` (already set here). If changed, restart the client.
- Ref requires `REF_API_KEY`; Exa requires `EXA_API_KEY`; GitHub requires `GITHUB_TOKEN`.
- DigitalOcean uses `scripts/mcp_digitalocean.sh` wrapper to source `DIGITALOCEAN_ACCESS_TOKEN` (or `~/.config/doctl/config.yaml`). Restart Codex CLI after edits.

Always Maintain Docs
- Any change to deployment, scaling, or data policy must be reflected in `/docs/` (e.g., `docs/infra/growth-plan.md`, `docs/deploy/*`, `docs/storage/buckets.md`).
- DigitalOcean uses `scripts/mcp_digitalocean.sh` wrapper to source `DIGITALOCEAN_ACCESS_TOKEN` (or `~/.config/doctl/config.yaml`).

DigitalOcean MCP
- Ensure auth: run `doctl auth init` or export `DIGITALOCEAN_ACCESS_TOKEN`.
- Wrapper: `scripts/mcp_digitalocean.sh` supplies `-digitalocean-api-token` to `@digitalocean/mcp`.
- Config: `[mcp_servers.digitalocean]` points to the wrapper. Restart Codex CLI after edits.

**MCP Troubleshooting**
- Tools missing after config changes: restart Codex CLI to reload MCP servers.
- Browserbase session errors (HTTP 400): verify API key, project ID, and account limits; consider SHTTP remote per vendor docs.
- Ref/Exa rate limits: back off and summarize partial results; avoid rapid loops.
- Always avoid logging secrets; never echo API keys.

Appendix: Common Commands
- List files: `rg --files -n`
- Search text: `rg "term"`
- Read file (first 200 lines): `sed -n '1,200p' path`
- UI install: `make install`
- UI dev: `make dev`
- UI build: `make build`
- UI lint: `make lint`
- UI typecheck: `make typecheck`

This guide complements `docs/ai/codex-cli-guidance.md`. Keep both updated as workflows evolve.
