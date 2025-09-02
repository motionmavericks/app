#!/bin/bash
# Simple Codex CLI wrapper for subagent usage
# Usage: ./run-codex.sh "Your prompt here"

PROMPT="$*"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR=".codex/output"
mkdir -p "$OUTPUT_DIR"

# Run Codex with the prompt
echo "🚀 Codex: $PROMPT" | tee -a "$OUTPUT_DIR/history.log"
output=$(codex "$PROMPT" 2>&1)
exit_code=$?

# Save output
echo "$output" > "$OUTPUT_DIR/latest.md"
echo "[$TIMESTAMP] $PROMPT" >> "$OUTPUT_DIR/history.log"
echo "$output" >> "$OUTPUT_DIR/history.log"
echo "---" >> "$OUTPUT_DIR/history.log"

# Return output
echo "$output"
exit $exit_code