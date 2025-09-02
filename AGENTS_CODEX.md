# AGENTS.md - Codex CLI Configuration

## Purpose
This file configures how Codex CLI should be used when called from Claude Code's orchestration system.

## Model Settings
- Default model: GPT-5 with medium reasoning
- Use high reasoning for complex architectural decisions
- Enable Full Access mode for network operations when needed

## Task Patterns

### When called by Claude Code:
1. Focus on the specific task provided
2. Return clear status: DONE/BLOCKED/PARTIAL
3. Use --exec for non-interactive execution
4. Output results to .codex/output/ directory

## Common Commands

### Complex Reasoning
```bash
codex --model gpt-5 --reasoning high --exec "task description"
```

### Dependency Resolution
```bash
codex --full-auto --exec "analyze and resolve dependency conflicts"
```

### Architecture Planning
```bash
codex --suggest --exec "design system architecture for [component]"
```

### One-shot Solutions
```bash
codex --auto-edit --exec "implement [specific feature]"
```

## Integration Protocol

### Input Format
- Task description in `.codex/task.md`
- Context files in `.codex/context/`
- Requirements in `.codex/requirements.md`

### Output Format
- Results in `.codex/output/result.md`
- Generated code in `.codex/output/code/`
- Status codes:
  - 0: Success (DONE)
  - 1: Blocked (BLOCKED)
  - 2: Partial completion (PARTIAL)

## Best Use Cases
1. **Architecture Design**: System design, API planning, database schemas
2. **Complex Dependencies**: Resolving version conflicts, upgrading frameworks
3. **Algorithm Design**: Complex algorithms, optimization problems
4. **Code Generation**: Boilerplate, scaffolding, initial implementations

## Limitations
- Don't use for bulk operations (use Qwen instead)
- Avoid for simple CRUD operations
- Not optimal for documentation generation

## Error Handling
```bash
# Always capture errors
codex --exec "task" 2>&1 | tee .codex/output/log.txt
```

## Context Preservation
- Save important outputs to `.codex/history/`
- Include previous results when continuing tasks
- Use `--context` flag to provide additional context files