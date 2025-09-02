# Claude Code (CLI)

Purpose
- Use Claude Code alongside Codex for nuanced, local-context tasks while Codex handles repo-wide mechanical work.

Install & Auth
- Follow Anthropic’s docs: https://docs.anthropic.com/en/docs/claude-code/quickstart and CLI reference: https://docs.anthropic.com/en/docs/claude-code/cli-reference
- Ensure `claude` is on your PATH and `ANTHROPIC_API_KEY` (or interactive auth) is configured.

Makefile targets
- `make claude` — interactive REPL in the repo root
- `make claude-plan` — non-interactive plan via `claude -p` (max 3 turns)
- `make claude-audit-*` — fast, scoped audits similar to Qwen targets

CLI cheatsheet
- Interactive: `claude`
- One-shot: `claude -p "query" --max-turns 3`
- Add dirs: `claude --add-dir ../services ../packages`
- MCP servers: `claude mcp` (configure MCP for tools you need)
- Output JSON: `claude -p "query" --output-format json`

Power flags (use carefully)
- Continue last session: `claude --continue` or `claude --continue -p "<next step>"`
- Skip permissions prompts: `claude --dangerously-skip-permissions` (only when you trust the planned edits and have backups/VC)
- Limit turns: `--max-turns 2` to keep non-interactive runs snappy in CI

Division of labor (Codex × Claude Code)
- Repo-wide, parallel, mechanical (Codex) vs. nuanced, local-context fixes (Claude Code)
- CI/CD: Codex automates pipelines/releases; Claude debugs failing jobs locally
- Features: Codex scaffolds & propagates changes; Claude shapes design & intricate logic
- Migrations: Codex sweeps configs/frameworks; Claude resolves service-specific quirks
- Perf & reliability: Codex adds tracing/retries; Claude profiles and optimizes hot paths
- Docs & DX: Codex keeps docs in sync; Claude polishes guides/runbooks
- Security & governance: Codex enforces policies; Claude tunes least-privilege/auth edge cases
- Data & schema: Codex generates migrations; Claude writes reversible, safe changes
- Frontend: Codex codemods fleets; Claude resolves complex state/perf issues

Handoff patterns
- Spec → Sweep: Claude drafts RFC + exemplar diff → Codex executes repo-wide → Claude reviews/fixes edge cases
- Bulk → Surgical: Codex opens many PRs → Claude lands the 10–20% needing context
- CI Fail → Local Fix: Codex reports failures → Claude reproduces locally, patches root cause

Usage pattern in this repo
- Start with `make claude-plan` for a backlog; use `make claude-audit-*` for scoped checks; implement fixes via Codex `apply_patch` and keep docs/env in sync.
 - Subagents: see `docs/ai/claude-subagents.md` for routing, MCP-first policy, guardrails, and validation checklists.
