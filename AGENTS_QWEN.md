# AGENTS.md - Qwen Code CLI Configuration

## Purpose
This file configures how Qwen Code CLI should be used when called from Claude Code's orchestration system.

## Model Settings
- Model: qwen3-coder-480b (480B parameters, 35B active)
- Context: 256K tokens native (1M with extrapolation)
- API Endpoint: DashScope or local deployment

## Environment Setup
```bash
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export OPENAI_MODEL="qwen3-coder-480b"
# Or for local deployment:
# export OPENAI_BASE_URL="http://localhost:8000/v1"
```

## Task Patterns

### When called by Claude Code:
1. Handle bulk operations efficiently
2. Process entire directories or large files
3. Generate comprehensive test suites
4. Batch documentation updates
5. Large-scale refactoring

## Common Commands

### Bulk Refactoring
```bash
qwen-code refactor --pattern "oldPattern" --replacement "newPattern" --dir src/
```

### Test Generation
```bash
qwen-code generate-tests --recursive --dir src/ --output tests/
```

### Documentation Generation
```bash
qwen-code document --format markdown --recursive --output docs/
```

### Code Analysis
```bash
qwen-code analyze --metrics --dir . --output .qwen/analysis/
```

### Batch Processing
```bash
qwen-code batch --input .qwen/batch.jsonl --output .qwen/results/
```

## Integration Protocol

### Input Format
- Single task: `.qwen/task.json`
- Batch tasks: `.qwen/batch.jsonl`
- Configuration: `.qwen/config.json`

### Output Format
- Results in `.qwen/output/`
- Logs in `.qwen/logs/`
- Generated files in specified directories

### Task JSON Structure
```json
{
  "task": "description",
  "operation": "bulk-refactor|test-generation|documentation",
  "targets": ["file1.ts", "file2.ts"],
  "options": {
    "recursive": true,
    "format": "markdown"
  }
}
```

## Best Use Cases
1. **Bulk Operations**: Refactoring across 10+ files
2. **Test Generation**: Creating comprehensive test suites
3. **Documentation**: Generating docs for entire modules
4. **Code Migration**: Framework upgrades, API changes
5. **Pattern Replacement**: Systematic code updates

## Optimization Tips
- Use batch processing for multiple similar tasks
- Leverage the 256K context for large file operations
- Enable caching for repeated operations
- Use parallel processing where possible

## Error Handling
```bash
# Capture and log errors
qwen-code [command] 2>&1 | tee .qwen/logs/$(date +%Y%m%d-%H%M%S).log
```

## Performance Settings
```json
{
  "parallel": true,
  "cache": true,
  "maxWorkers": 4,
  "chunkSize": 50000
}
```

## Context Preservation
- Save session state to `.qwen/session/`
- Use `--continue` flag to resume interrupted tasks
- Archive results in `.qwen/archive/` for reference