# Codex CLI Guidance (AI-Friendly Docs)

Patterns
- Each doc names: Purpose, Inputs, Outputs, Steps, Acceptance.
- Keep commands copy‑pasteable; avoid ambiguous prose; prefer checklists.

Tasks (examples)
- "Add endpoint /api/presign": Inputs (types), Files to edit, Tests to add, Acceptance (HTTP examples).
- "Create Player component": Props, Events, Edge cases, Accessibility checks.

Prompts
- Provide context paths (e.g., `docs/api/endpoints/presign.md`) and acceptance tests.
- Ask the AI to propose a patch via apply_patch and include command outputs.

Validation
- After changes, prefer root wrappers: `make typecheck`, `make lint`, `make build`.
- For frontend-only tasks, verify dev boot: `make dev` and load http://localhost:3001.

MCP Usage
- Prefer MCP tools where available (Docs, Search, GitHub, Browserbase, DigitalOcean).
- DigitalOcean MCP: launched via `scripts/mcp_digitalocean.sh` which supplies the API token. Restart Codex CLI after MCP config edits.
- Keep actions atomic and narrate with short preambles.

Docs Discipline
- Any code change must be reflected in `/docs/` before considering the task complete.
- Add or update env templates (`*.env.example`) and ensure `docs/configuration/env.md` stays in sync.
- Update deployment and runbook instructions whenever service behavior or commands change.
