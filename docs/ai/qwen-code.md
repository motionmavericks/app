# Qwen Code CLI

Purpose
- Complement Codex CLI with an agentic coding assistant optimized for large codebases and workflow automation.

What It Is
- Qwen Code is a command-line AI coding agent adapted from Gemini CLI and tuned for Qwen Coder models (Qwen3‑Coder).
- Strengths: repo‑scale code understanding, refactoring, test generation, documentation, dependency mapping, and automated git/file ops.

Install & Run
- Prereq: Node.js 20+
- Run directly via npx (recommended):
  - `make qwen` (wrapper target)
  - or `npx -y @qwen-code/qwen-code`

Codex Integration Patterns
- Non‑interactive planning: `make qwen-plan` uses `--prompt` to request a prioritized, end‑to‑end task list without allowing Qwen to edit files (approval mode is default).
- Guardrails: keep `--approval-mode` at `default` so Qwen does not apply edits; Codex remains the only agent to modify files via `apply_patch`.
- Scope control: avoid `--all-files` to reduce token use; include additional dirs via `--include-directories` if needed.
- Extensions: list with `qwen --list-extensions`; keep only needed ones via `--extensions` for reproducibility.

Auth Options
- Easiest (recommended): Qwen OAuth
  - `make qwen` and follow the browser login.
- OpenAI‑compatible providers (pick one):
  - OpenRouter: set `OPENAI_API_KEY`, `OPENAI_BASE_URL=https://openrouter.ai/api/v1`, `OPENAI_MODEL=qwen/qwen3-coder:free`
  - Alibaba DashScope Intl: `OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, `OPENAI_MODEL=qwen3-coder-plus`
  - ModelScope (CN, free tier): `OPENAI_BASE_URL=https://api-inference.modelscope.cn/v1`, `OPENAI_MODEL=Qwen/Qwen3-Coder-480B-A35B-Instruct`

Usage Tips
- Start: `make qwen`
- Good prompts:
  - “Explain this repo’s architecture; list services and their boundaries.”
  - “Generate unit tests for module X; include edge cases.”
  - “Refactor Y for readability and SOLID; propose a minimal diff.”
  - “Create OpenAPI docs for routes under Z.”
  - “Summarize security model; call out secrets handling and RBAC.”
 - Planning (non-interactive): `make qwen-plan` to produce a Markdown task list, then let Codex implement patches and docs updates.

Session Controls
- `.qwen/settings.json` (optional): `{ "sessionTokenLimit": 32000 }`
- Commands: `/clear`, `/compress`, `/stats`, `/exit`

How We Use It With Codex
- Qwen Code: exploration at scale, automated scaffolds, transformation suggestions.
- Codex CLI: surgical edits with `apply_patch`, plans via `update_plan`, validation (`make typecheck`, `make build`), and MCP tool orchestration (DigitalOcean, Ref, Exa, Browserbase).

Validation
- After Qwen‑suggested changes: run `make typecheck`, `make lint`, `make build` and iterate. Do not commit generated artifacts.

Links
- Qwen Code: https://github.com/QwenLM/qwen-code
- Qwen3‑Coder overview: https://qwenlm.github.io/blog/qwen3-coder/
