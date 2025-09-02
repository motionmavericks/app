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
  - Recommended: Playwright, Browserbase, Neo4j Cypher, Sequential Thinking
- Ensure `.claude/settings.json` has `enableAllProjectMcpServers=true` so project MCP servers load.
- Remember: MCP tools are for development/diagnostics and staging; production deployments must go via CI/CD.

### Subagent → MCP Mapping (New)
- task-router → Sequential Thinking (planning/revisions); maintains update_plan
- mcp-coordinator → GitHub, DigitalOcean, Sentry, Ref, Exa, Browserbase, Playwright, Neo4j
- test-orchestrator/test-writer → Playwright (E2E) + Qwen (bulk tests)
- architecture-planner → Ref/Exa research + sequential-thinking/codex
- implementation-specialist → apply_patch, Makefile validations
- security-auditor → Sentry + Ref; codex for deep analysis
- performance-tuner → Sentry perf + DigitalOcean metrics
- graph-architect → Neo4j (read-only) + Ref/Exa
- graph-ops-migrator → Neo4j migrate (staging-first) + GitHub/DO
- deployment-orchestrator → GitHub (runs) + DigitalOcean (apps)

### Env & Setup Sanity (non-secrets)
- GitHub: `GITHUB_TOKEN` set and scoped
- DigitalOcean: `DIGITALOCEAN_ACCESS_TOKEN` or doctl configured
- Ref: `REF_API_KEY` set
- Exa: `EXA_API_KEY` set
- Sentry: `SENTRY_AUTH_TOKEN` (or MCP OAuth configured)
- Browserbase: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`
- Neo4j: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` (`NEO4J_DATABASE` optional)
- Playwright MCP available (installed per `.mcp.json` if used)

### Model Tooling (non-MCP)
- Subagents may delegate to Codex (planning/analysis) or Qwen (bulk) when beneficial. Precision/surgical coding uses apply_patch. These are orchestrated by subagents; do not call directly from meta steps.

### Subagent Alias Mapping (for legacy steps)
- If a core instruction step uses legacy names, map as follows:
  - orchestrator → task-router
  - context-fetcher → mcp-coordinator (research via Ref/Exa)
  - external-delegator → mcp-coordinator (DigitalOcean/GitHub/Neo4j/Browserbase/Playwright)
  - test-runner/validator → test-orchestrator (+ Playwright + Sentry)

### Task/Output Specs (standardize handoffs)
- TaskSpec: title, context_links, constraints, acceptance_checks, priority_tools, docs_to_update
- OutputSpec: changes_summary, apply_patch diff/paths, validations_run, docs/env_updates, MCP_actions, followups

## Parallel Subagents Readiness
- When a step declares background or parallel work, spawn the named subagents concurrently (e.g., `validator`, `project-manager`, `orchestrator`, `external-delegator`, `test-runner`, `git-workflow`).
- Claude hooks assist automatically (e.g., PostToolUse lint, PreCompact backups). Keep them enabled; no manual invocation required.

### Important
- Do not invoke MCP tools directly from meta instructions. Always route via the appropriate subagent which will prefer the correct MCP server.
