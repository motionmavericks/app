#!/bin/bash
#!/bin/bash
# MCP Integration Setup Helper (Development Only)
# Prefer project .mcp.json config. This script only checks envs and prints guidance.

echo "🔧 Verifying MCP environment for development..."

# Check if claude CLI is available (optional)
if ! command -v claude &> /dev/null; then
    echo "⚠️ Claude CLI not found. You can still use project-level MCP via .mcp.json."
fi

status_line() {
  local var="$1"; local label="$2"; local hint="$3";
  if [ -n "${!var}" ]; then
    echo "✅ $label configured"
  else
    echo "⚠️ $label not set. $hint"
  fi
}

echo "\nEnv checks (non-secret preview):"
status_line GITHUB_TOKEN "GitHub" "export GITHUB_TOKEN=... (repo/PR scopes)"
status_line DIGITALOCEAN_ACCESS_TOKEN "DigitalOcean" "export DIGITALOCEAN_ACCESS_TOKEN=... (Apps/Databases/DNS as needed)"
status_line REF_API_KEY "Ref" "export REF_API_KEY=..."
status_line EXA_API_KEY "Exa" "export EXA_API_KEY=..."
status_line SENTRY_AUTH_TOKEN "Sentry" "export SENTRY_AUTH_TOKEN=... (or ensure Sentry MCP OAuth)"

echo "\n📄 Project MCP config: .mcp.json (preferred)"
echo "- Servers declared here are auto-enabled by .claude/settings.json (enableAllProjectMcpServers=true)."
echo "- Add new servers (e.g., Playwright, Neo4j Cypher) by extending .mcp.json, then restart Codex/Claude."

echo "\n🚫 Note: MCP tools are for development and diagnostics only. Do not run production deployments via MCP."
echo "   Use CI/CD workflows and documented deploy scripts instead."

echo "\nUseful commands:"
echo "  claude mcp list                 # List configured MCP servers"
echo "  cat .mcp.json                   # Inspect project-level MCP config"
echo "  scripts/mcp_digitalocean.sh     # DO wrapper sourcing DO token (used by .mcp.json)"

echo "\n✅ MCP environment check complete."
