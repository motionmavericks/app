# MCP Tools Configuration Guide

> Last Updated: 2025-09-02
> Version: 1.0.0
> Purpose: How to configure MCP tools for development

## Overview

This guide explains how to configure MCP tools for use during development of the Motion Mavericks Creative Production Management System. These tools enhance developer productivity and AI agent capabilities during the development process.

## Prerequisites

1. Ensure you have the required API tokens for each service
2. Set up environment variables as described below
3. Install Node.js (required for most MCP tools)

## Environment Variable Setup

Create a `.env` file in your project root or export these variables:

```bash
# GitHub Personal Access Token (for GitHub MCP)
export GITHUB_TOKEN=your_github_personal_access_token

# Ref API Key (for Ref MCP)
export REF_API_KEY=your_ref_api_key

# Exa API Key (for Exa MCP)
export EXA_API_KEY=your_exa_api_key

# DigitalOcean Access Token (for DigitalOcean MCP)
export DIGITALOCEAN_ACCESS_TOKEN=your_do_api_token
```

## MCP Configuration File

Create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "sentry": {
      "url": "https://mcp.sentry.dev/mcp"
    },
    "digitalocean": {
      "command": "bash",
      "args": ["scripts/mcp_digitalocean.sh"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "ref": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-ref"],
      "env": {
        "REF_API_KEY": "${REF_API_KEY}"
      }
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-exa"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Tool-Specific Setup

### Sequential Thinking
No additional setup required. Runs via npx.

### Sentry
No additional setup required. Uses remote endpoint.

### DigitalOcean
Ensure you have:
1. DigitalOcean account and API token
2. `doctl` CLI installed and configured
3. `scripts/mcp_digitalocean.sh` script in your project

### GitHub
Requires GitHub Personal Access Token with appropriate scopes:
- `repo` for repository access
- `read:org` for organization information
- `gist` for gist access

### Ref
Requires Ref API key from https://ref.tools/

### Exa
Requires Exa API key from https://exa.ai/

### Playwright
No additional setup required. Runs via npx.

## Usage Examples

### Basic Commands
```bash
# Test MCP configuration
cat .mcp.json

# Use a specific MCP tool (if using Codex CLI)
# @mcp github "Show recent commits to backend service"
# @mcp ref "Find documentation for Fastify JWT"
# @mcp exa "Research HLS streaming best practices"
```

### Development Workflow Examples
```bash
# Planning phase
# Use Sequential Thinking to break down a feature
# Use Exa to research implementation approaches
# Use Ref to lookup relevant documentation

# Implementation phase
# Use GitHub to understand existing code patterns
# Use Ref to lookup API documentation as needed

# Testing phase
# Use Playwright for end-to-end testing
# Use Sentry to monitor for errors during testing

# Deployment phase
# Use DigitalOcean to manage infrastructure
# Use Sentry to set up monitoring
```

## Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables** for token management
3. **Limit token scopes** to minimum required permissions
4. **Rotate tokens regularly**
5. **Use separate tokens** for different environments
6. **Monitor token usage** and access logs

## Troubleshooting

### Common Issues

1. **Authentication failures**
   - Verify tokens are correctly set
   - Check token expiration dates
   - Confirm token scopes are sufficient

2. **Network connectivity issues**
   - Check firewall and proxy settings
   - Verify internet connectivity
   - Test with simple curl commands

3. **Tool not found errors**
   - Ensure Node.js is installed
   - Check npm/npx availability
   - Verify tool installation commands

### Diagnostic Commands

```bash
# Check environment variables
echo $GITHUB_TOKEN
echo $REF_API_KEY
echo $EXA_API_KEY
echo $DIGITALOCEAN_ACCESS_TOKEN

# Test basic tool access
npx -y @modelcontextprotocol/server-sequential-thinking --help
npx -y @modelcontextprotocol/server-github --help
npx -y @modelcontextprotocol/server-ref --help
npx -y @modelcontextprotocol/server-exa --help
npx @playwright/mcp@latest --help

# Test DigitalOcean setup
doctl auth init
doctl account get
```

## Getting Help

### Documentation
- Refer to individual tool documentation
- Check the main MCP tools development guide
- Review service provider documentation

### Community Support
- GitHub repositories for each MCP tool
- Community forums and discussions
- Issue trackers for bug reports

This configuration guide should help you set up MCP tools for development use, keeping them separate from the application being built while enhancing your development workflow.