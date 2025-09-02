#!/bin/bash
# Codex CLI Wrapper for Claude Code Integration
# Usage: ./codex-wrapper.sh "Your prompt here"

PROMPT="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR=".codex/output"
LOG_DIR=".codex/logs"

# Create directories if they don't exist
mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

# Log the request
echo "[$TIMESTAMP] Request: $PROMPT" >> "$LOG_DIR/history.log"

# Determine if this needs high reasoning
if [[ "$PROMPT" == *"architecture"* ]] || \
   [[ "$PROMPT" == *"design"* ]] || \
   [[ "$PROMPT" == *"optimize"* ]] || \
   [[ "$PROMPT" == *"algorithm"* ]]; then
    echo "🧠 Using high reasoning for complex task..."
    COMMAND="codex --model gpt-5 --reasoning high"
else
    COMMAND="codex"
fi

# Execute Codex
echo "🚀 Running: $COMMAND \"$PROMPT\""
output=$($COMMAND "$PROMPT" 2>&1)
exit_code=$?

# Save output
echo "$output" > "$OUTPUT_DIR/latest.md"
echo "$output" > "$OUTPUT_DIR/$TIMESTAMP.md"

# Display result
if [ $exit_code -eq 0 ]; then
    echo "✅ Success! Output saved to $OUTPUT_DIR/latest.md"
    echo "---"
    echo "$output"
else
    echo "❌ Failed with exit code $exit_code"
    echo "Output: $output"
fi

exit $exit_code