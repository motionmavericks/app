#!/bin/bash
# Qwen CLI Wrapper for Claude Code Integration  
# Usage: ./qwen-wrapper.sh "Your prompt here"

PROMPT="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR=".qwen/output"
LOG_DIR=".qwen/logs"

# Create directories if they don't exist
mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

# Set Qwen environment (uncomment and configure as needed)
# export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
# export OPENAI_MODEL="qwen3-coder-480b"

# Log the request
echo "[$TIMESTAMP] Request: $PROMPT" >> "$LOG_DIR/history.log"

# Determine operation type
if [[ "$PROMPT" == *"test"* ]] || [[ "$PROMPT" == *"Test"* ]]; then
    echo "🧪 Generating tests..."
    OPERATION="test-generation"
elif [[ "$PROMPT" == *"document"* ]] || [[ "$PROMPT" == *"Document"* ]]; then
    echo "📝 Generating documentation..."
    OPERATION="documentation"
elif [[ "$PROMPT" == *"refactor"* ]] || [[ "$PROMPT" == *"rename"* ]]; then
    echo "🔄 Performing refactoring..."
    OPERATION="refactoring"
elif [[ "$PROMPT" == *"migrate"* ]] || [[ "$PROMPT" == *"upgrade"* ]]; then
    echo "📦 Performing migration..."
    OPERATION="migration"
else
    echo "⚙️ Running general task..."
    OPERATION="general"
fi

# Execute Qwen
echo "🚀 Running: qwen \"$PROMPT\""
output=$(qwen "$PROMPT" 2>&1)
exit_code=$?

# Save output
echo "$output" > "$OUTPUT_DIR/latest.md"
echo "$output" > "$OUTPUT_DIR/$TIMESTAMP-$OPERATION.md"

# Save operation metadata
cat > "$OUTPUT_DIR/latest-metadata.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "operation": "$OPERATION",
  "prompt": "$PROMPT",
  "exit_code": $exit_code,
  "output_file": "$OUTPUT_DIR/$TIMESTAMP-$OPERATION.md"
}
EOF

# Display result
if [ $exit_code -eq 0 ]; then
    echo "✅ Success! Output saved to $OUTPUT_DIR/latest.md"
    echo "---"
    echo "$output" | head -50
    echo "..."
    echo "(Full output in $OUTPUT_DIR/latest.md)"
else
    echo "❌ Failed with exit code $exit_code"
    echo "Output: $output"
fi

exit $exit_code