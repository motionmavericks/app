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
- For UI-only tasks, verify dev boot: `make dev` and load http://localhost:3000.
