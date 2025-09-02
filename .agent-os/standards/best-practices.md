# Development Best Practices

## Context

Global development guidelines for Agent OS projects.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions
</conditional-block>

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation
</conditional-block>

<conditional-block context-check="project-workflow">
IF this Project Workflow section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Project Workflow already in context"
ELSE:
  READ: The following workflow practices

## Project Workflow

### Quickstart
- Explore the repo: `rg --files -n`, `rg "keyword"`, `ls -la`
- Frontend dev: `make install && make dev` (http://localhost:3001)
- Validate: `make typecheck`, `make lint`, `make build`
- Docs entry: `docs/index.md` (see `docs/architecture/services-plan.md`)

### Init
- Start a fresh Codex instance and run `/init` or `make init`
- The init script validates tools and deployment spec, summarizes services, and prints helpful commands

### Planning and Momentum
- Use the `update_plan` tool for multi-step or ambiguous tasks
- Keep steps short (≤7 words), one `in_progress` at a time
- Narrate progress with concise preambles before tool calls

### Editing Files
- Always modify files via `apply_patch`; do not use shell redirection
- Keep diffs minimal and focused; avoid unrelated refactors
- Do not add license headers unless asked; avoid inline code comments unless requested

### Shell Usage
- Prefer ripgrep: `rg` for content, `rg --files -n` for file listing
- Read files in chunks ≤250 lines: `sed -n '1,200p' path`
- Keep command output small; avoid destructive commands

</conditional-block>

<conditional-block context-check="docs-discipline">
IF this Docs Discipline section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Docs Discipline already in context"
ELSE:
  READ: The following documentation practices

## Docs Discipline
- Treat `docs/` as source of truth; any code/config change must be reflected
- Update env templates and `docs/configuration/env.md` together; add new vars to `.env.example`
- For new endpoints/features: update `docs/api/*` and link from `docs/dev-setup.md`
- For deployment/runtime changes: update `deploy/*` and service docs under `docs/backend/services/*` and `docs/architecture/*`
- Prefer linking to specific doc files in PR descriptions and summaries

</conditional-block>

<conditional-block context-check="validation">
IF this Validation section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Validation rules already in context"
ELSE:
  READ: The following validation practices

## Validation
- Frontend or UI code changes: run `make typecheck`, `make lint`, `make build`; use `make dev` for HMR
- Docs changes: ensure links resolve and commands are copy‑pasteable
- Prefer Makefile wrappers over raw commands for consistency

</conditional-block>

<conditional-block context-check="security-config">
IF this Security & Configuration section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Security & Configuration already in context"
ELSE:
  READ: The following security practices

## Security & Configuration
- Never commit secrets; use `.env` and provide `.env.example` placeholders
- Use runtime env vars; for UI, only expose `NEXT_PUBLIC_*`
- Pin dependencies where reasonable; address critical advisories
- Treat production Wasabi buckets as read-only; create staging buckets for development

</conditional-block>

<conditional-block context-check="testing-guidelines">
IF this Testing Guidelines section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Testing Guidelines already in context"
ELSE:
  READ: The following testing guidelines

## Testing Guidelines
- Frameworks: Jest/Vitest for JS/TS; pytest for Python
- Layout: tests mirror source; one test file per module
- Coverage: target ≥80% for changed code; add regression tests with bug fixes
- Run: `npm test --silent` or `pytest -q` when present

</conditional-block>

<conditional-block context-check="commits-prs">
IF this Commits & PRs section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Commits & PRs already in context"
ELSE:
  READ: The following commit and PR conventions

## Commits & PRs
- Conventional Commits (e.g., `feat:`, `fix:`, `docs:`)
- Keep PRs small; include purpose, linked issues, acceptance checks
- Update docs and `CHANGELOG` if present; add screenshots for UI changes

</conditional-block>

<conditional-block context-check="mcp-usage">
IF this MCP Usage section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using MCP Usage already in context"
ELSE:
  READ: The following MCP usage practices

## MCP Tools & Configuration
- Prefer MCP tools over ad‑hoc HTTP: Exa (search), Ref (docs), GitHub, Browserbase, DigitalOcean
- Keep actions atomic (navigate → extract → act) and add short preambles
- Config file: `~/.codex/config.toml` under `[mcp_servers.*]`
- DigitalOcean auth via `scripts/mcp_digitalocean.sh` with `DIGITALOCEAN_ACCESS_TOKEN` or `~/.config/doctl/config.yaml`
- Restart Codex CLI after MCP config changes

### Full MCP Server Capabilities

#### Sequential Thinking (@modelcontextprotocol/server-sequential-thinking)
- Purpose: Lightweight planning/reasoning scaffold for stepwise thought orchestration
- Tools: sequential_thinking with revision/branching controls
- Usage: Breaking down big tasks, drafting multi-step plans, exploring alternatives
- Config: `npx -y @modelcontextprotocol/server-sequential-thinking`
- Tip: Set DISABLE_THOUGHT_LOGGING=true to silence thought logs

#### Sentry (https://mcp.sentry.dev/mcp)
- Purpose: Pull issues, errors, projects, releases, performance data with Seer analysis
- Tools: 16+ tools for organizations, projects, issues, releases, DSNs
- Usage: Error tracking, root-cause analysis, fix suggestions
- Config: Hosted OAuth (preferred) or local STDIO with proper scopes
- Example: "List unresolved crashes in project X this week"

#### DigitalOcean (DO Labs MCP)
- Purpose: Manage DO resources (Apps, Databases, DOKS, Droplets, Insights, Spaces)
- Tools: App Platform deploy/logs, Database provisioning, Spaces management
- Usage: Deploy, logs, scale, costs/insights queries
- Config: DIGITALOCEAN_API_TOKEN with scoped services
- Example: "Create a PostgreSQL 14 DB" or "Deploy from GitHub"

#### GitHub (@modelcontextprotocol/server-github)
- Purpose: Direct access to repos, code, issues, PRs, code scanning
- Tools: Repository context, Issues & PRs, Security scanning, Identity
- Usage: Branch/PR workflows, code editing, security analysis
- Config: Remote URL (OAuth) or PAT auth with proper scopes
- Example: "Show my private repos" or "Create PR for this change"

#### Ref (Documentation MCP)
- Purpose: High-precision, token-efficient documentation search & retrieval
- Tools: ref_search_documentation, ref_read_url
- Usage: Targeted doc search, URL to markdown conversion
- Config: Remote URL with API key or local NPX with REF_API_KEY
- Example: "Find React hooks documentation" or "Read this API guide"

#### Exa (exa-mcp-server)
- Purpose: Real-time web search + specialty research tools
- Tools: web_search_exa, deep_researcher, company_research, crawling, linkedin_search
- Usage: Live web search, deep research, company info aggregation
- Config: Remote URL with EXA_API_KEY or local NPX
- Example: "Research current Next.js performance best practices"

#### Playwright (@playwright/mcp)
- Purpose: Full browser automation (navigate, click, type, evaluate, capture)
- Tools: Interact, Navigate, Inspect, Verify, Files & output
- Usage: E2E testing, smoke tests, browser flows, scraping
- Config: NPX with optional caps and network controls
- Example: "Open staging URL, log in, verify 'Order placed' is visible"

#### Neo4j — Cypher (mcp-neo4j-cypher)
- Purpose: Query and manipulate Neo4j graph data via Cypher for both read and write operations
- Tools: get_neo4j_schema, read_neo4j_cypher, write_neo4j_cypher
- Usage: Graph data querying, relationship analysis, knowledge graph operations
- Config: Connection string with authentication credentials
- Example: "Retrieve the schema via get_neo4j_schema and describe the graph entities and relationships"

### DigitalOcean MCP
- Ensure auth: `doctl auth init` or export `DIGITALOCEAN_ACCESS_TOKEN`
- Validate app specs with `doctl apps update "$APP_ID" --spec spec.yaml --wait` (validate-only varies)
- Tail deploy logs: `doctl apps logs "$APP_ID" backend --type deploy --tail 200`

### MCP Usage Patterns for Development

#### Planning & Analysis
- Use Sequential Thinking to break down complex development tasks
- Apply Sequential Thinking for architectural planning and design exploration
- Use Sequential Thinking to revise and branch different implementation approaches

#### Research & Documentation
- Use Exa for current web research and technology exploration
- Use Ref to find precise documentation for APIs and libraries
- Combine Exa → Ref for comprehensive research workflows

#### Code Development & Version Control
- Use GitHub for repository exploration and code understanding
- Use GitHub for pull request workflows and code reviews
- Use GitHub for issue tracking and project management

#### Infrastructure & Deployment
- Use DigitalOcean for managing development and staging environments
- Use DigitalOcean for deployment testing and infrastructure validation
- Use DigitalOcean for cost analysis and resource optimization

#### Testing & Quality Assurance
- Use Playwright for end-to-end testing of user interfaces
- Use Playwright for automated smoke testing
- Use Playwright for browser automation and scraping tasks

#### Monitoring & Debugging
- Use Sentry for error tracking and performance analysis
- Use Sentry for root cause analysis of issues
- Use Sentry with Seer for automated fix suggestions

#### Knowledge Management & Graph Analysis
- Use Neo4j for storing and querying development knowledge graphs
- Use Neo4j for tracking relationships between code entities
- Use Neo4j for architectural decision documentation and impact analysis

### When to Use Each MCP Tool (Development Context)

#### Sequential Thinking
- When planning complex feature implementations
- When breaking down large tasks into manageable steps
- When exploring alternative design approaches
- When revising and refining development strategies

#### Exa & Ref
- When researching new technologies or approaches
- When looking up documentation for unfamiliar APIs
- When validating implementation patterns and best practices
- When gathering current industry standards and examples

#### GitHub
- When understanding existing codebase structure
- When creating and managing pull requests
- When conducting code reviews and analysis
- When tracking issues and project progress

#### DigitalOcean
- When provisioning development environments
- When testing deployment configurations
- When analyzing infrastructure costs and performance
- When managing staging and testing resources

#### Playwright
- When testing user interface functionality
- When automating repetitive manual testing tasks
- When validating user flows and workflows
- When capturing screenshots for documentation

#### Sentry
- When analyzing application errors and exceptions
- When monitoring performance and identifying bottlenecks
- When investigating user-reported issues
- When tracking error trends and patterns

#### Neo4j
- When modeling complex relationships in the codebase
- When tracking architectural decisions and their impacts
- When analyzing dependencies between components
- When building knowledge graphs for development insights

### Security & Operations Tips
- Scope down DO with --services ... and GitHub via OAuth/PAT scopes
- Treat write tools (GitHub/DO) as production-impacting—prefer dry-run conventions
- For Playwright, consider isolated sessions and blocked/allowed origins
- For Neo4j, use read-only credentials where writes aren't intended
- Always parameterize Neo4j queries to prevent injection
- Enterprise admins can control Copilot MCP usage/policies

### Troubleshooting
- Missing tools after config changes: restart Codex CLI
- Browserbase 400 errors: verify API key, project ID, limits
- Ref/Exa rate limits: back off, summarize partial results
- Avoid logging secrets; never echo API keys

</conditional-block>

<conditional-block context-check="appendix-commands">
IF this Appendix section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Appendix commands already in context"
ELSE:
  READ: The following common commands

## Appendix: Common Commands
- List files: `rg --files -n`
- Search text: `rg "term"`
- Read file (first 200 lines): `sed -n '1,200p' path`
- UI install: `make install`
- UI dev: `make dev`
- UI build: `make build`
- UI lint: `make lint`
- UI typecheck: `make typecheck`

</conditional-block>
