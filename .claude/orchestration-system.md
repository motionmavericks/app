# Multi-Agent Orchestration System
## Claude Code + Codex CLI + Qwen Code Integration

This document defines how to use Claude Code as the primary orchestrator with Codex CLI and Qwen Code as specialized external agents.

MCP-first: When interacting with external systems (GitHub, DigitalOcean, docs/web, browsers, monitoring, graphs), prefer MCP servers over direct CLIs. MCP tools are for development and diagnostics only, not for production deployments.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│          Claude Code (Primary Orchestrator)      │
│  - Subagents for internal tasks                  │
│  - Hooks for automation                          │
│  - MCP for external integrations                 │
└────────┬──────────────────────┬──────────────────┘
         │                      │
    ┌────▼────────┐      ┌─────▼──────────┐
    │  Codex CLI  │      │  Qwen Code CLI │
    │  (GPT-5)    │      │  (Qwen3-Coder) │
    └─────────────┘      └────────────────┘
```

## 1. Claude Code Configuration

### Subagents (.claude/subagents/)

#### orchestrator.json
```json
{
  "name": "orchestrator",
  "description": "Master orchestrator that delegates to external CLIs when needed",
  "tools": ["Task", "Bash", "TodoWrite", "Read", "Grep"],
  "prompt": "You orchestrate complex projects. Use Bash to call 'codex' for GPT-5 tasks and 'qwen-code' for bulk operations. Maintain task list with TodoWrite."
}
```

#### precision-coder.json
```json
{
  "name": "precision-coder",
  "description": "Handles critical implementations and complex debugging",
  "tools": ["Read", "Edit", "MultiEdit", "Bash", "Grep"],
  "prompt": "Focus on code quality, architectural decisions, and complex debugging. You handle the most critical parts of the codebase."
}
```

#### external-delegator.json
```json
{
  "name": "external-delegator",
  "description": "Manages external CLI tools (Codex and Qwen)",
  "tools": ["Bash", "Read", "Write", "TodoWrite"],
  "prompt": "You specialize in using external CLI tools. Use 'codex' for complex reasoning tasks and 'qwen-code' for bulk operations. Always read AGENTS.md files before delegating."
}
```

### Hooks Configuration (.claude/claude.json)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "make lint 2>/dev/null || npm run lint 2>/dev/null || echo 'No linter configured'"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "if [[ \"$CLAUDE_PROMPT\" == *\"complex\"* ]]; then echo '💡 Consider using @external-delegator for Codex/Qwen'; fi" } ] },
      { "hooks": [ { "type": "command", "command": "if [[ \"$CLAUDE_PROMPT\" == *\"github\"* ]] || [[ \"$CLAUDE_PROMPT\" == *\"pull request\"* ]]; then echo '🔧 MCP-first: use GitHub MCP for repo/PR/issue operations'; fi" } ] },
      { "hooks": [ { "type": "command", "command": "if [[ \"$CLAUDE_PROMPT\" == *\"digitalocean\"* ]] || [[ \"$CLAUDE_PROMPT\" == *\"app platform\"* ]]; then echo '🔧 MCP-first: use DigitalOcean MCP (development only)'; fi" } ] }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "claude todo export > .claude/todo-backup-$(date +%Y%m%d-%H%M%S).json"
          }
        ]
      }
    ]
  }
}
```

## 2. Codex CLI Integration

### AGENTS.md for Codex
```markdown
# AGENTS.md - Codex Configuration

## Model Settings
- Default model: GPT-5 with medium reasoning
- Use high reasoning for complex architectural decisions
- Enable Full Access mode for network operations

## Task Patterns
When called by Claude Code:
1. Focus on the specific task provided
2. Return clear status: DONE/BLOCKED/PARTIAL
3. Use --exec for non-interactive execution
4. Output results to .codex/output/ directory

## Commands
- Complex reasoning: `codex --model gpt-5 --reasoning high`
- Dependency resolution: `codex --full-auto --exec "resolve dependencies"`
- Architecture planning: `codex --suggest --exec "design system architecture"`

## Integration Protocol
- Input: Task description in .codex/task.md
- Output: Results in .codex/output/result.md
- Status: Exit code 0 (success), 1 (blocked), 2 (partial)
```

### Codex Wrapper Script (.claude/scripts/run-codex.sh)
```bash
#!/bin/bash
# Wrapper for Codex CLI integration

TASK="$1"
OUTPUT_DIR=".codex/output"
mkdir -p "$OUTPUT_DIR"

# Write task to file
echo "$TASK" > .codex/task.md

# Run Codex with appropriate settings
if [[ "$TASK" == *"architecture"* ]] || [[ "$TASK" == *"design"* ]]; then
    codex --model gpt-5 --reasoning high --exec "cat .codex/task.md" > "$OUTPUT_DIR/result.md" 2>&1
elif [[ "$TASK" == *"dependency"* ]] || [[ "$TASK" == *"conflict"* ]]; then
    codex --full-auto --exec "cat .codex/task.md && resolve" > "$OUTPUT_DIR/result.md" 2>&1
else
    codex --auto-edit --exec "cat .codex/task.md" > "$OUTPUT_DIR/result.md" 2>&1
fi

EXIT_CODE=$?
echo "Status: $EXIT_CODE" >> "$OUTPUT_DIR/result.md"
exit $EXIT_CODE
```

## 3. Qwen Code CLI Integration

### AGENTS.md for Qwen
```markdown
# AGENTS.md - Qwen Code Configuration

## Model Settings
- Model: qwen3-coder-480b
- Context: 256K tokens (1M with extrapolation)
- API: DashScope or local deployment

## Task Patterns
When called by Claude Code:
1. Handle bulk operations efficiently
2. Process entire directories or large files
3. Generate comprehensive test suites
4. Batch documentation updates

## Commands
- Bulk refactoring: `qwen-code refactor --pattern "old" --replacement "new"`
- Test generation: `qwen-code generate-tests --dir src/`
- Documentation: `qwen-code document --recursive`

## Integration Protocol
- Input: Task in .qwen/task.json
- Output: Results in .qwen/output/
- Batch processing: Use .qwen/batch.jsonl for multiple tasks
```

### Qwen Wrapper Script (.claude/scripts/run-qwen.sh)
```bash
#!/bin/bash
# Wrapper for Qwen Code CLI integration

TASK="$1"
OPERATION="$2"
OUTPUT_DIR=".qwen/output"
mkdir -p "$OUTPUT_DIR"

# Configure Qwen environment
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export OPENAI_MODEL="qwen3-coder-480b"

# Write task configuration
cat > .qwen/task.json <<EOF
{
  "task": "$TASK",
  "operation": "$OPERATION",
  "timestamp": "$(date -Iseconds)"
}
EOF

# Run Qwen Code based on operation type
case "$OPERATION" in
    "bulk-refactor")
        qwen-code refactor --config .qwen/task.json > "$OUTPUT_DIR/refactor.log" 2>&1
        ;;
    "test-generation")
        qwen-code generate-tests --recursive --output "$OUTPUT_DIR/tests/" 2>&1
        ;;
    "documentation")
        qwen-code document --format markdown --output "$OUTPUT_DIR/docs/" 2>&1
        ;;
    *)
        qwen-code --exec "$(cat .qwen/task.json)" > "$OUTPUT_DIR/result.md" 2>&1
        ;;
esac

EXIT_CODE=$?
echo "Qwen Status: $EXIT_CODE" >> "$OUTPUT_DIR/status.log"
exit $EXIT_CODE
```

## 4. Orchestration Workflows

### Complex Feature Implementation
```bash
# Claude Code orchestrator delegates tasks

# 1. Architecture design (Codex)
claude chat
> @orchestrator Design authentication system architecture
# Internally runs: bash .claude/scripts/run-codex.sh "Design OAuth2 authentication with JWT"

# 2. Implementation (Claude precision-coder)
> @precision-coder Implement core auth logic based on .codex/output/result.md

# 3. Bulk operations (Qwen)
> @external-delegator Generate tests for all auth modules
# Internally runs: bash .claude/scripts/run-qwen.sh "auth modules" "test-generation"

# 4. External integrations (MCP-first)
> @orchestrator Use GitHub MCP to open a PR for the auth feature
> @orchestrator Use DigitalOcean MCP to tail backend deploy logs (dev) and summarize errors

# 4. Validation (Claude validator)
> Run all tests and validate implementation
```

### Parallel Processing Example
```bash
# TodoWrite task list
[
  { "content": "Design API architecture", "agent": "codex", "status": "pending" },
  { "content": "Implement core logic", "agent": "claude", "status": "pending" },
  { "content": "Generate test suite", "agent": "qwen", "status": "pending" },
  { "content": "Create documentation", "agent": "qwen", "status": "pending" }
]

# Parallel execution via orchestrator
@orchestrator Execute tasks 1 and 3 in parallel while I work on task 2
```

## 5. Best Practices

### Task Routing Decision Tree
```
Is it a complex reasoning/architecture task?
  → YES: Route to Codex (GPT-5)
  
Is it a bulk operation (>10 files or >1000 lines)?
  → YES: Route to Qwen Code
  
Is it critical implementation or debugging?
  → YES: Keep in Claude Code (precision-coder)
  
Is it validation/testing?
  → YES: Claude Code with hooks
```

### Error Handling
```bash
# In wrapper scripts, always capture and report status
if ! codex_output=$(codex --exec "$TASK" 2>&1); then
    echo "ERROR: Codex failed with output: $codex_output" >&2
    echo "$codex_output" > .codex/error.log
    exit 1
fi
```

### Context Preservation
- Use .claude/, .codex/, and .qwen/ directories for state
- Export task history to preserve context across sessions
- Maintain AGENTS.md files for each tool's configuration

## 6. MCP Integration for External Services

```bash
# Add external service integrations
claude mcp add github github:token@$GITHUB_TOKEN
claude mcp add linear linear:api-key@$LINEAR_API_KEY

# These provide context to all agents
```

## Usage Example

```bash
# Initialize the orchestration system
mkdir -p .claude/scripts .codex/output .qwen/output
chmod +x .claude/scripts/*.sh

# Start orchestrated workflow
claude chat
> @orchestrator We need to refactor the entire authentication system to use OAuth2, 
> add comprehensive tests, and update all documentation. Break this down and use 
> the appropriate tools for each part.

# The orchestrator will:
# 1. Use Codex for OAuth2 architecture design
# 2. Use Claude for critical implementation
# 3. Use Qwen for bulk test generation and docs
# 4. Coordinate and track progress via TodoWrite
```

This system leverages each tool's strengths while maintaining Claude Code as the central orchestrator.
