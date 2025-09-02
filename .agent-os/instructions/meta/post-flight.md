---
description: Common Post-Flight Steps for Agent OS Instructions
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Post-Flight Rules

After completing all steps in a process_flow, always review your work and verify:

- Every numbered step has read, executed, and delivered according to its instructions.

- All steps that specified a subagent should be used, did in fact delegate those tasks to the specified subagent.  IF they did not, see why the subagent was not used and report your findings to the user.

- IF you notice a step wasn't executed according to it's instructions, report your findings and explain which part of the instructions were misread or skipped and why.

## Parallel Work Join & Cleanup
- Confirm all declared parallel/background subagents completed and their outputs were integrated (e.g., validator results, task updates, planning notes).
- Stop/cleanup any long-running watchers.
- Confirm Claude hooks executed (lint after edits, todo backup on compact/end) and artifacts are in expected locations.

## MCP-First Verification
- Verify external interactions used MCP tools (GitHub/DO/Exa/Ref/Playwright/Sentry/Neo4j/Sequential Thinking) where applicable, and that they were invoked via the correct subagent.
- Reiterate that deployments, if any, were routed through CI/CD, not MCP.

## Planning/Reasoning Closure (if used)
- If Sequential Thinking MCP was employed by the orchestrator, ensure the planning sequence is concluded and key decisions are captured in the relevant spec/task docs.

## Recap of Tooling (optional)
- Optionally record, in recap or PR notes, which MCP servers were used and high-level outcomes (e.g., “DO logs: clean”, “Sentry: no new errors”).
