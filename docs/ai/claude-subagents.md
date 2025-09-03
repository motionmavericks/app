# Claude Code Subagents — Routing, MCP-First, Guardrails

This document defines the specialized subagent architecture, routing matrix, MCP-first policy, and guardrails adopted in this repo.

## Routing Matrix (task → subagent)
- Architecture/design → `.claude/agents/architecture-planner.md`
- Implementation (surgical) → `.claude/agents/implementation-specialist.md`
- Bulk refactors/tests/docs → `.claude/agents/bulk-processor.md`, `.claude/agents/qwen-specialist.md`
- Testing orchestration → `.claude/agents/test-orchestrator.md` (delegates to `.claude/agents/test-writer.md`)
- Documentation → `.claude/agents/documentation-generator.md`
- Security review → `.claude/agents/security-auditor.md`
- Performance tuning → `.claude/agents/performance-tuner.md`
- Debugging/root-cause → `.claude/agents/debugging-specialist.md`
- Dependencies → `.claude/agents/dependency-manager.md`
- Code review → `.claude/agents/code-reviewer.md`
- Git/PRs → `.claude/agents/git-coordinator.md`
- Deployment/CI → `.claude/agents/deployment-orchestrator.md`
- External tools → `.claude/agents/mcp-coordinator.md`
- Graph modeling → `.claude/agents/graph-architect.md`
- Graph migrations → `.claude/agents/graph-ops-migrator.md`

Entry point: `.claude/agents/task-router.md`

## MCP-First Policy
- Research → Ref (read) then Exa (discover)
- DOM-required → Browserbase (navigate → observe/extract → act)
- E2E/UI → Playwright
- Repo/PRs → GitHub MCP
- Deploy/DO Apps → DigitalOcean MCP (dev/staging only; prod via CI/CD)
- Errors/Perf → Sentry MCP
- Graph → Neo4j MCP (read-only by default; writes via migration gates)

## Guardrails
- Unified diffs only; scope to enumerated files; hard-fail on drift
- YAML/JSON via yq/jq (no ad-hoc sed)
- DOCR rules: omit `image.registry`, set `registry_type: DOCR`, pin backend `tag: sha-${GITHUB_SHA}` in CI
- Docs discipline: update `/docs/*` and env templates; link changed paths

## Handoffs
- TaskSpec: title, context_links, constraints, acceptance_checks, priority_tools, docs_to_update
- OutputSpec: changes_summary, apply_patch diffs/paths, validations_run, docs/env_updates, MCP_actions, followups

## Validation
- Run `make typecheck`, `make lint`, `make build` after code changes
- Deploy validation: yq image matrix, GitHub workflow watch, `doctl apps update --spec ... --wait` (validate-only varies), `doctl apps logs ... --tail 200`

## Iterative Debug Loop
- Trigger: A debugging attempt fails validations (tests/typecheck/build/lint).
- Research: Use MCP-first policy to gather context each loop.
  - Ref: fetch authoritative docs for implicated libraries/frameworks.
  - Exa: discover relevant solutions and official guidance using the error signature.
- Enrich: Synthesize 4–6 actionable Research Notes and attach them to the next Codex prompt.
- Retry: Delegate back to `@codex-specialist`/`debugger-codex` with Error Summary, Prior Attempt Summary, and Research Notes.
- Bounds: Max 3 iterations by default; on persistent failure, return a concise report with proposed next steps.

## Codex I/O Policy
- No timeouts: Subagents must never set timeouts for Codex CLI.
- Outcome-only: Prompts must require final artifact only, with no explanations and no code fences. For JSON outputs, include: "Return valid JSON only."

## Neo4j Notes
- Env: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, optional `NEO4J_DATABASE`
- Modeling/queries: prefer `EXPLAIN/PROFILE`; avoid Cartesian products; add constraints/indexes
- Migrations: staging-first; batched; idempotent; rollback steps documented

See also:
- `docs/ai/codex-cli-guidance.md`
- `docs/ai/claude-code.md`
- `docs/ai/qwen-code.md`
- `docs/ai/mcp-tools-development-guide.md`
- `docs/deploy/digitalocean.md`
