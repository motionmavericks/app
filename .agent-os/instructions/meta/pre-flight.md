---
description: Common Pre-Flight Steps for Agent OS Instructions
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Pre-Flight Rules

- IMPORTANT: For any step that specifies a subagent in the subagent="" XML attribute you MUST use the specified subagent to perform the instructions for that step.

- Process XML blocks sequentially

- Read and execute every numbered step in the process_flow EXACTLY as the instructions specify.

- If you need clarification on any details of your current task, stop and ask the user specific numbered questions and then continue once you have all of the information you need.

- Use exact templates as provided

## MCP & Subagents Preparation (Development)
- Verify MCP servers from project `.mcp.json` are enabled.
  - Core: GitHub, DigitalOcean, Ref, Exa, Sentry
  - Optional (recommended): Playwright, Neo4j Cypher, Sequential Thinking
- Ensure `.claude/settings.json` has `enableAllProjectMcpServers=true` (already set) so project MCP servers are loaded.
- Remember: MCP tools are for development and diagnostics only; production deployments must go via CI/CD.

### Subagent → MCP Mapping
- orchestrator → may use Sequential Thinking (planning/revisions)
- context-fetcher → Exa (discover) → Ref (fetch docs)
- git-workflow → GitHub (repo/PR/issue ops)
- external-delegator → DigitalOcean (dev logs/specs), Neo4j Cypher (graph)
- sentry-integrator → Sentry (issues, performance, releases, Seer) and instrumentation guidance
- test-runner → Playwright (browser flows/assertions)
- validator → Sentry (regressions) via sentry-integrator; Playwright (UI spot checks) via external-delegator

### Env & Setup Sanity (non-secrets)
- GitHub: `GITHUB_TOKEN` set and scoped
- DigitalOcean: `DIGITALOCEAN_ACCESS_TOKEN` or doctl configured
- Ref: `REF_API_KEY` set
- Exa: `EXA_API_KEY` set
- Sentry: `SENTRY_AUTH_TOKEN` (or MCP OAuth configured)
- Neo4j (optional): `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
- Playwright MCP available (installed per `.mcp.json` if used)

### Model Tooling (non-MCP)
- Subagents may delegate to Codex (planning/analysis) or Qwen (bulk) when beneficial. Precision coding remains with Claude. These are orchestrated by subagents; do not call directly from meta steps.

## Parallel Subagents Readiness
- When a step declares background or parallel work, spawn the named subagents concurrently (e.g., `validator`, `project-manager`, `orchestrator`, `external-delegator`, `test-runner`, `git-workflow`).
- Claude hooks assist automatically (e.g., PostToolUse lint, PreCompact backups). Keep them enabled; no manual invocation required.

### Important
- Do not invoke MCP tools directly from meta instructions. Always route via the appropriate subagent which will prefer the correct MCP server.
