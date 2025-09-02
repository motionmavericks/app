# MCP Tools Development Guide

> Last Updated: 2025-09-02
> Version: 1.0.0
> Purpose: Guidance for using MCP tools in development workflows

## Overview

This guide provides instructions on when and how to use different MCP (Model Context Protocol) servers during development of the Motion Mavericks Creative Production Management System. These tools are meant to enhance developer productivity and AI agent capabilities during the development process, not as part of the application runtime.

## Available MCP Servers

### 1. Sequential Thinking (@modelcontextprotocol/server-sequential-thinking)

**Purpose**: Lightweight planning/reasoning scaffold for stepwise thought orchestration

**When to Use**:
- Breaking down complex tasks into smaller steps
- Planning multi-phase implementations
- Exploring alternative approaches to problems
- Validating solution approaches before implementation

**How to Use**:
```bash
# Install and run
npx -y @modelcontextprotocol/server-sequential-thinking

# Example usage in development:
# "Plan the implementation of the new review comment feature"
# "Break down the GPU transcoding optimization task"
# "Explore alternatives for the asset versioning approach"
```

**Best Practices**:
- Use for complex architectural decisions
- Apply to multi-step implementation plans
- Let it guide exploration of alternatives
- Set DISABLE_THOUGHT_LOGGING=true to reduce noise

### 2. Sentry (https://mcp.sentry.dev/mcp)

**Purpose**: Pull issues, errors, projects, releases, performance data for analysis

**When to Use**:
- Debugging production issues and errors
- Analyzing performance bottlenecks
- Investigating crash reports and user feedback
- Understanding system behavior through telemetry

**How to Use**:
```bash
# Configure in .mcp.json
{
  "mcpServers": {
    "sentry": {
      "url": "https://mcp.sentry.dev/mcp"
    }
  }
}

# Example usage:
# "Analyze the most frequent errors in the preview worker"
# "Show performance issues affecting user experience"
# "Investigate the root cause of recent deployment failures"
```

**Best Practices**:
- Use for post-mortem analysis of issues
- Apply to understand user-impacting problems
- Combine with Seer for automated analysis when available
- Focus on patterns rather than individual incidents

### 3. DigitalOcean (DO Labs MCP)

**Purpose**: Manage DO resources in natural language via MCP

**When to Use**:
- Provisioning development or staging environments
- Managing infrastructure during testing
- Scaling resources for performance testing
- Troubleshooting deployment issues

**How to Use**:
```bash
# Configure in .mcp.json
{
  "mcpServers": {
    "digitalocean": {
      "type": "stdio",
      "command": "bash",
      "args": ["scripts/mcp_digitalocean.sh"]
    }
  }
}

# Example usage:
# "Create a staging environment with 2vCPU/4GB for testing"
# "Scale the preview worker to 4 instances for load testing"
# "Check the status of the production database cluster"
# "Deploy the latest build to the staging environment"
```

**Best Practices**:
- Always use staging environments for testing
- Scope down permissions to minimum required
- Use descriptive names for resources
- Clean up temporary resources after testing

### 4. GitHub (@modelcontextprotocol/server-github)

**Purpose**: Direct access to repos, code, issues, PRs, code scanning

**When to Use**:
- Code review and analysis
- Issue and PR management
- Repository exploration and understanding
- Code quality and security analysis

**How to Use**:
```bash
# Configure in .mcp.json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}

# Example usage:
# "Show me recent PRs that modified the transcoding service"
# "Find issues related to playback performance"
# "Analyze the codebase structure for the edge service"
# "Search for security vulnerabilities in dependencies"
```

**Best Practices**:
- Use specific queries to avoid information overload
- Focus on relevant parts of the codebase
- Combine with code scanning for security analysis
- Use for understanding historical context of changes

### 5. Ref (Documentation MCP)

**Purpose**: High-precision, token-efficient documentation search & retrieval

**When to Use**:
- Looking up API documentation
- Understanding library usage patterns
- Finding specific configuration options
- Researching best practices and guidelines

**How to Use**:
```bash
# Configure in .mcp.json
{
  "mcpServers": {
    "ref": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-ref"],
      "env": {
        "REF_API_KEY": "${REF_API_KEY}"
      }
    }
  }
}

# Example usage:
# "Find documentation for Fastify JWT plugin configuration"
# "Show me examples of Redis Streams consumer groups"
# "Look up TailwindCSS responsive design breakpoints"
# "Find Next.js App Router documentation for server components"
```

**Best Practices**:
- Be specific with search queries
- Focus on the exact information needed
- Use for validating implementation approaches
- Combine with Exa for broader research

### 6. Exa (exa-mcp-server)

**Purpose**: Real-time web search + specialty research tools

**When to Use**:
- Researching new technologies and approaches
- Finding current best practices and patterns
- Understanding industry trends and innovations
- Gathering competitive analysis information

**How to Use**:
```bash
# Configure in .mcp.json
{
  "mcpServers": {
    "exa": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-exa"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    }
  }
}

# Example usage:
# "Research current HLS streaming optimization techniques"
# "Find best practices for GPU-accelerated video processing"
# "Look up security patterns for signed URL implementations"
# "Research competitor features in creative production platforms"
```

**Best Practices**:
- Use for strategic research and planning
- Apply to technology selection and evaluation
- Focus on recent and relevant information
- Validate findings with multiple sources

### 7. Playwright (@playwright/mcp)

**Purpose**: Full browser automation for testing and verification

**When to Use**:
- End-to-end testing of user flows
- Smoke testing of critical functionality
- Regression testing after changes
- Automated verification of UI behavior

**How to Use**:
```bash
# Configure in .mcp.json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}

# Example usage:
# "Test the upload workflow with a sample video file"
# "Verify the preview playback functionality"
# "Check the login flow with valid credentials"
# "Run smoke tests on the review commenting feature"
```

**Best Practices**:
- Focus on critical user journeys
- Use isolated test environments
- Implement proper test data management
- Combine with other testing approaches

## Development Workflow Integration

### Planning Phase
1. **Sequential Thinking**: Break down feature requirements
2. **Exa**: Research current best practices
3. **Ref**: Look up relevant documentation
4. **GitHub**: Understand existing implementation patterns

### Implementation Phase
1. **GitHub**: Code review and analysis
2. **Sequential Thinking**: Step-by-step implementation planning
3. **Ref**: API documentation lookup
4. **Sentry**: Understanding error handling patterns

### Testing Phase
1. **Playwright**: End-to-end testing
2. **DigitalOcean**: Environment management
3. **Sentry**: Error monitoring setup
4. **GitHub**: Test result analysis

### Deployment Phase
1. **DigitalOcean**: Infrastructure provisioning
2. **Sentry**: Monitoring configuration
3. **GitHub**: Release management
4. **Sequential Thinking**: Deployment validation

## Configuration Setup

### Environment Variables
```bash
# Required for different MCP servers
export GITHUB_TOKEN=your_github_personal_access_token
export REF_API_KEY=your_ref_api_key
export EXA_API_KEY=your_exa_api_key
export DIGITALOCEAN_ACCESS_TOKEN=your_do_api_token
```

### .mcp.json Configuration
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

## Security Considerations

### Access Control
- Use personal access tokens with minimal required scopes
- Rotate tokens regularly
- Never commit tokens to version control
- Use environment variables for token management

### Environment Isolation
- Use separate environments for development, staging, and production
- Limit MCP tool access to appropriate environments
- Implement proper network segmentation
- Use isolated test data

### Data Protection
- Avoid logging sensitive information
- Use encrypted storage for credentials
- Implement proper data retention policies
- Regularly audit access and usage

## Best Practices

### Tool Selection
- Choose the right tool for each task
- Combine tools for complex workflows
- Avoid tool sprawl - focus on essential tools
- Regularly evaluate tool effectiveness

### Usage Patterns
- Start with planning (Sequential Thinking)
- Research as needed (Exa, Ref)
- Implement with proper testing (Playwright, GitHub)
- Deploy with monitoring (DigitalOcean, Sentry)

### Performance Optimization
- Use caching where appropriate
- Limit concurrent tool usage
- Implement proper error handling
- Monitor resource consumption

### Collaboration
- Share tool configurations with team members
- Document usage patterns and best practices
- Provide training on tool usage
- Establish clear guidelines for tool selection

## Troubleshooting

### Common Issues
1. **Authentication failures**: Check tokens and scopes
2. **Rate limiting**: Implement backoff strategies
3. **Network connectivity**: Verify firewall and proxy settings
4. **Tool availability**: Check service status pages

### Resolution Strategies
1. **Verbose logging**: Enable detailed output for debugging
2. **Isolated testing**: Test tools individually
3. **Environment validation**: Verify configuration
4. **Community support**: Check documentation and forums

## Getting Started

### Quick Setup
1. Install required tokens and environment variables
2. Configure .mcp.json with desired servers
3. Test connectivity with simple queries
4. Integrate into development workflow

### Example First Tasks
1. Use GitHub to explore the codebase structure
2. Use Ref to look up documentation for a library
3. Use Sequential Thinking to plan a small feature
4. Use Playwright to test a critical user flow

This guide should help developers and AI agents effectively leverage MCP tools during the development process while keeping them separate from the application being built.