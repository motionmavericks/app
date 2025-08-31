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

Repository Map (current)
- `frontend/`: Next.js app (App Router, Tailwind v4)
- `docs/`: Architecture, endpoints, ops, runbooks
- `tools/`: Utilities (e.g., `tools/wasabi_audit.py`)
- `Makefile`: top-level wrappers (`install`, `dev`, `build`, `lint`, `typecheck`, `test`, `clean`)

Agent Workflow
- Be concise, direct, and friendly. Provide momentum with short preambles before tool calls.
- Prefer minimal, scoped changes; avoid touching unrelated areas.
- Always keep the user informed of the next immediate step.

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
