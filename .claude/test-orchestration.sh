#!/bin/bash
# Test script for the multi-agent orchestration system

echo "🧪 Testing Multi-Agent Orchestration System"
echo "==========================================="
echo ""

# Test 1: Check subagents exist
echo "1️⃣ Checking subagents..."
if [ -d ".claude/agents" ] && [ "$(ls -A .claude/agents)" ]; then
    echo "✅ Subagents found:"
    ls -1 .claude/agents/*.md | xargs -I {} basename {} .md | sed 's/^/   - /'
else
    echo "❌ No subagents found in .claude/agents/"
fi
echo ""

# Test 2: Check hooks configuration
echo "2️⃣ Checking hooks configuration..."
if [ -f ".claude/claude.json" ]; then
    echo "✅ Hooks configured in .claude/claude.json"
    echo "   Hooks available:"
    grep -o '"PostToolUse"\|"UserPromptSubmit"\|"PreCompact"\|"Stop"' .claude/claude.json | sort -u | sed 's/"//g' | sed 's/^/   - /'
else
    echo "❌ No hooks configuration found"
fi
echo ""

# Test 3: Check wrapper scripts
echo "3️⃣ Checking wrapper scripts..."
for script in codex-wrapper.sh qwen-wrapper.sh run-codex.sh run-qwen.sh; do
    if [ -x ".claude/scripts/$script" ]; then
        echo "✅ $script is executable"
    else
        echo "❌ $script missing or not executable"
    fi
done
echo ""

# Test 4: Check CLI tools availability
echo "4️⃣ Checking CLI tools..."
if command -v codex &> /dev/null; then
    echo "✅ Codex CLI available"
else
    echo "⚠️ Codex CLI not installed (install with: npm install -g @openai/codex)"
fi

if command -v qwen &> /dev/null; then
    echo "✅ Qwen CLI available"
else
    echo "⚠️ Qwen CLI not installed (install with: npm install -g @qwen-code/qwen-code)"
fi
echo ""

# Test 5: Check configuration files
echo "5️⃣ Checking configuration files..."
for file in AGENTS_CODEX.md AGENTS_QWEN.md .claude/TOOL_SELECTION_GUIDE.md .claude/orchestration-system.md; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done
echo ""

# Test 6: Check CLAUDE.md integration
echo "6️⃣ Checking CLAUDE.md integration..."
if grep -q "Multi-Agent Orchestration System" CLAUDE.md 2>/dev/null; then
    echo "✅ CLAUDE.md contains orchestration documentation"
else
    echo "❌ CLAUDE.md missing orchestration documentation"
fi
echo ""

# Summary
echo "==========================================="
echo "📊 Summary:"
echo ""
echo "To use the system:"
echo "1. Call subagents with @orchestrator, @precision-coder, etc."
echo "2. External tools: codex \"prompt\" or qwen \"prompt\""
echo "3. MCP setup: Run .claude/mcp-setup.sh with tokens"
echo ""
echo "Example workflow:"
echo '  claude chat'
echo '  > @orchestrator Design and implement user auth system'
echo ""
echo "The orchestrator will automatically delegate to:"
echo "  - Codex for architecture design"
echo "  - Claude for implementation"
echo "  - Qwen for test generation"