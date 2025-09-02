# Agent OS Product Documentation

This directory contains comprehensive product documentation for Motion Mavericks' Creative Production Management System, designed for both human developers and AI agents working on the project.

## Quick Start Guide

### For Developers
1. **Start Here**: Read `mission.md` for product vision and current status
2. **Technical Context**: Review `tech-stack.md` for architecture decisions
3. **Development Planning**: Check `roadmap.md` for upcoming features
4. **Decision History**: Reference `decisions.md` for architectural rationale

### For AI Agents
- **Product Context**: Use `mission-lite.md` for understanding business requirements
- **Technical Constraints**: Reference `tech-stack.md` and `decisions.md` for implementation guidelines
- **Feature Priorities**: Check `roadmap.md` for development priorities and effort estimates
- **Override Authority**: `decisions.md` contains highest-priority directives that override conflicting instructions

## File Overview

| File | Purpose | Key Information |
|------|---------|-----------------|
| `mission.md` | Product vision and status | Mission, problem statement, current capabilities |
| `mission-lite.md` | Condensed mission | Lightweight version for AI context |
| `roadmap.md` | Development phases | Phase 0 (complete), Phases 1-5 planning with features and timelines |
| `tech-stack.md` | Technical architecture | Complete stack details, service architecture, dependencies |
| `decisions.md` | Architectural decisions | Key technical choices with context and rationale |
| `README.md` | Documentation guide | This file - how to use the documentation |

## Current Status (Phase 0 - Production Ready)

The system is currently in production with these core capabilities:
- ✅ Multi-format content ingest and processing
- ✅ GPU-accelerated HLS transcoding pipeline
- ✅ Three-bucket storage architecture (staging/masters/previews)  
- ✅ HMAC-signed edge delivery service
- ✅ JWT authentication with role-based access control
- ✅ Basic media asset management interface

## Architecture Summary

**Multi-Service Architecture:**
- **Frontend**: Next.js 15 on port 3001 (upload/playback UI)
- **Backend API**: Fastify on port 3000 (presigned URLs, asset CRUD, PostgreSQL/Redis)
- **Preview Worker**: Node.js GPU-accelerated HLS/thumbnail generation
- **Edge Service**: Fastify on port 8080 (HMAC signed URL verification, content delivery)

**Data Flow:**
1. Upload → API presign → Wasabi Staging
2. Promote → Masters (object lock) → Enqueue preview job
3. Worker → Generate HLS/thumbnails → Previews bucket
4. Edge → Validate HMAC signature → Serve from Previews

## Development Priorities

**Next Phase (Phase 1 - Q1 2025): Enhanced Collaboration**
- Frame-accurate review tools with timeline commenting
- Real-time collaboration with live cursor tracking
- Configurable approval workflows
- Asset version control with diff visualization

## Key Decision Overrides

These decisions in `decisions.md` override any conflicting instructions:

1. **Three-Bucket Storage**: Must use staging/masters/previews architecture
2. **HMAC Security**: All content delivery must use signed URLs through edge service  
3. **Multi-Service**: Maintain separation between frontend/backend/worker/edge services
4. **JWT + RBAC**: Authentication must use JWT with Admin/Manager/Editor/Viewer roles
5. **GPU Transcoding**: Use NVENC with libx264 fallback for all video processing

## Usage Guidelines

### For Code Changes
1. Check `decisions.md` for any architectural constraints
2. Reference `tech-stack.md` for approved technologies and patterns
3. Consider `roadmap.md` priorities when proposing new features
4. Leverage MCP tools for development, testing, and diagnostics (not production deployments)

### For AI Agents
- Always prioritize directives from `decisions.md`
- Use `mission-lite.md` context when making product decisions
- Reference `roadmap.md` for feature priority and effort estimates
- Follow `tech-stack.md` technology choices and architectural patterns
- Utilize MCP tools for research, planning, and implementation

### For Documentation Updates
- Update relevant files when making architectural changes
- Add new decisions to `decisions.md` with proper ID and rationale
- Keep `mission.md` current status section updated
- Update `roadmap.md` when phases or features change
- Reference appropriate MCP tools in technical documentation

## Related Documentation

- **Service Documentation**: Each service has detailed AGENTS.md files
- **Deployment Guide**: `docs/deploy/digitalocean.md`
- **Configuration**: `docs/configuration/env.md`  
- **Architecture Details**: `docs/architecture/services-plan.md`
- **Development Setup**: Root `CLAUDE.md` file
- **Agent OS Standards**: `.agent-os/standards/` directory
- **Agent OS Instructions**: `.agent-os/instructions/` directory
- **MCP Tools Guide**: `mcp-tools-guide.md` (Comprehensive MCP tools reference)

## Maintenance

This documentation should be updated when:
- New architectural decisions are made
- Development phases are completed or modified  
- Technical stack components are changed or upgraded
- Product vision or priorities shift

Last comprehensive review: 2025-09-02

## Agent OS Integration

This documentation follows the Agent OS framework for AI-assisted development:
- **Structured for AI consumption**: Clear sections and predictable formats
- **Cross-referenced**: Links between related concepts and decisions
- **Decision-first approach**: Architectural decisions take precedence over implementation details
- **Standards alignment**: Follows best practices from `.agent-os/standards/`
