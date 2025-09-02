# Tool Selection Guide - Quick Reference

## Simple Commands

### Codex (GPT-5)
```bash
codex "Your complex reasoning task here"
```

### Qwen (Qwen3-Coder-480B)  
```bash
qwen "Your bulk operation task here"
```

## When to Use Each Tool

### ✨ Use CODEX for:

**Architecture & Design**
- `codex "Design OAuth2 authentication system with JWT tokens"`
- `codex "Create database schema for multi-tenant SaaS application"`
- `codex "Design microservices architecture for payment processing"`

**Complex Problem Solving**
- `codex "Optimize this recursive algorithm for better time complexity"`
- `codex "Resolve circular dependency between these modules"`
- `codex "Fix race condition in concurrent file processing"`

**Dependency Resolution**
- `codex "Resolve conflicts between React 18, Next.js 14, and Material-UI 5"`
- `codex "Upgrade from Webpack 4 to Webpack 5 with all plugins"`
- `codex "Fix TypeScript errors after upgrading to v5"`

**One-Shot Complex Features**
- `codex "Implement real-time collaborative editing with conflict resolution"`
- `codex "Create GraphQL resolver with DataLoader for N+1 prevention"`
- `codex "Build rate limiting with Redis and sliding window algorithm"`

### 🔄 Use QWEN for:

**Bulk Refactoring (10+ files)**
- `qwen "Rename all 'userId' to 'userID' across entire codebase"`
- `qwen "Convert all require() to ES6 imports in src/"`
- `qwen "Update all API calls from v1 to v2 endpoints"`

**Test Generation**
- `qwen "Generate unit tests for all services in src/services/"`
- `qwen "Create integration tests for all API endpoints"`
- `qwen "Add test coverage for all React components"`

**Documentation**
- `qwen "Generate JSDoc comments for all exported functions"`
- `qwen "Create README files for each module"`
- `qwen "Document all REST API endpoints in OpenAPI format"`

**Code Migration**
- `qwen "Migrate all class components to functional components"`
- `qwen "Convert JavaScript files to TypeScript"`
- `qwen "Update all deprecated API usage to new syntax"`

**Large Files (>1000 lines)**
- `qwen "Refactor this 5000 line file into smaller modules"`
- `qwen "Add error handling to all async functions in large file"`
- `qwen "Split monolithic component into smaller components"`

### 🎯 Keep in CLAUDE for:

**Critical Implementation**
- Core business logic
- Security-sensitive code (auth, crypto)
- Complex state management
- Performance-critical algorithms

**Complex Debugging**
- Multi-file debugging sessions
- Memory leaks and performance issues
- Race conditions and deadlocks
- Subtle logic errors

**Code Review**
- Security audits
- Best practices enforcement
- Architecture reviews
- PR reviews

## Quick Decision Tree

```
Is it about system design or architecture?
  → CODEX

Does it affect 10+ files or need bulk changes?
  → QWEN

Is it a dependency/package conflict?
  → CODEX

Do you need to generate many similar things (tests, docs)?
  → QWEN

Is it security-critical or core business logic?
  → CLAUDE (internal)

Is it a complex algorithm or optimization?
  → CODEX

Does it need to process files >1000 lines?
  → QWEN

Is it a tricky bug requiring deep analysis?
  → CODEX (for analysis) then CLAUDE (for fix)
```

## Examples by Scenario

### Starting a New Feature
1. `codex "Design architecture for real-time chat feature"` → Get architecture
2. Use Claude internal agents → Implement core logic
3. `qwen "Generate tests for chat feature modules"` → Create test suite
4. `qwen "Document all chat API endpoints"` → Generate docs

### Large Refactoring Project
1. `codex "Plan migration strategy from Express to Fastify"` → Get strategy
2. `qwen "Update all route handlers to Fastify syntax"` → Bulk changes
3. Use Claude validator → Review and test
4. `qwen "Update all documentation for Fastify"` → Update docs

### Fixing Complex Bug
1. `codex "Analyze why this distributed cache is inconsistent"` → Root cause
2. Use Claude precision-coder → Implement fix
3. `qwen "Add tests to prevent cache inconsistency"` → Regression tests

### Performance Optimization
1. `codex "Identify bottlenecks in this data processing pipeline"` → Analysis
2. `codex "Design optimal caching strategy"` → Solution design
3. Use Claude → Implement optimizations
4. `qwen "Add performance benchmarks to test suite"` → Benchmarks

## Command Shortcuts

Add to your shell profile (.bashrc/.zshrc):

```bash
# Quick aliases for AI tools
alias cx='codex'                    # Quick codex
alias cxh='codex --reasoning high'  # Codex with high reasoning
alias qw='qwen'                     # Quick qwen
alias qwt='qwen "Generate tests for"'  # Qwen for tests
alias qwd='qwen "Document"'         # Qwen for docs

# Functions for common patterns
design() { codex "Design architecture for $*"; }
refactor() { qwen "Refactor: $*"; }
tests() { qwen "Generate comprehensive tests for $*"; }
debug() { codex "Debug and explain: $*"; }
```

Remember: 
- **Codex** = Deep thinking, complex reasoning
- **Qwen** = High volume, bulk operations  
- **Claude** = Critical code, security, final implementation

## MCP-First Policy (Development)

Prefer MCP tools when interacting with external systems:
- GitHub MCP: repo browsing, PRs, issues, code scanning
- DigitalOcean MCP: DO Apps/Databases/Spaces/DNS for development and diagnostics (not production deploys)
- Exa + Ref: live web research, then precise doc retrieval
- Playwright MCP: UI navigation, assertions, screenshots
- Sentry MCP: issue queries, performance data, Seer fix suggestions
- Neo4j Cypher MCP: graph schema/queries/writes
- Sequential Thinking MCP: structured planning with revisions/branches

Examples:
- "Use GitHub MCP to open a PR from current branch to main"
- "Use DigitalOcean MCP to tail last 200 lines of backend deploy logs (dev)"
- "Use Exa to find the best doc on Next.js caching; fetch with Ref"
- "Use Playwright MCP to login to http://localhost:3001 and assert 'Welcome'"

Gotchas:
- MCP servers are for development and staging. Production deployments must go through CI/CD.
- Prefer MCP over `gh`, `doctl`, or ad-hoc HTTP unless there’s a feature gap.
