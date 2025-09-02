# Documentation Cross-Reference Guide

> Last Updated: 2025-09-02
> Version: 1.0.0
> Agent OS Integration: Navigation Helper

## Purpose

This document provides cross-references between related concepts, decisions, and implementation details across the Agent OS product documentation to help both human developers and AI agents navigate the documentation more effectively.

## Key Decision Cross-References

### DEC-007: Three-Bucket Storage Architecture
- **Related Documents**: 
  - `tech-stack.md` (Storage Architecture section)
  - `mission.md` (Current Status section)
  - `roadmap.md` (Phase 0 Completed Features)
- **Implementation Files**:
  - `backend/src/storage.ts`
  - `worker/src/transcode.ts`
  - `edge/src/index.ts`

### DEC-006: GPU-Accelerated Transcoding
- **Related Documents**:
  - `tech-stack.md` (Worker Service section)
  - `mission.md` (Current Status section)
  - `roadmap.md` (Phase 0 Completed Features)
- **Implementation Files**:
  - `worker/src/transcode.ts`
  - `worker/Dockerfile`
  - `worker/package.json`

### DEC-005: HMAC-Signed URL Security
- **Related Documents**:
  - `tech-stack.md` (Edge Service section)
  - `mission.md` (Solution Approach section)
  - `decisions.md` (Security rationale)
- **Implementation Files**:
  - `edge/src/sign.ts`
  - `edge/src/index.ts`
  - `backend/src/api/presign.ts`

### DEC-004: Multi-Service Architecture
- **Related Documents**:
  - `tech-stack.md` (Backend Services section)
  - `README.md` (Architecture Summary)
  - `mission.md` (Solution Approach section)
- **Implementation Directories**:
  - `frontend/`
  - `backend/`
  - `worker/`
  - `edge/`

### DEC-003: JWT Authentication with RBAC
- **Related Documents**:
  - `tech-stack.md` (API Server section)
  - `mission.md` (Current Status section)
- **Implementation Files**:
  - `backend/src/auth.ts`
  - `frontend/src/lib/auth.ts`

## Roadmap Phase Cross-References

### Phase 0: Already Completed
- **Related Documents**:
  - `mission.md` (Current Status section)
  - `tech-stack.md` (Technical Foundation section)
  - `decisions.md` (DEC-001 through DEC-008)
- **Key Implementation Files**:
  - All core service entry points
  - Database schema (`database/schema.sql`)
  - Deployment configuration (`deploy/do-app.yaml`)

### Phase 1: Enhanced Collaboration
- **Related Documents**:
  - `mission.md` (User Personas section)
  - `roadmap.md` (Phase 1 details)
- **Planned Implementation Areas**:
  - `frontend/src/app/review/`
  - `backend/src/comments/`
  - `backend/src/notifications/`

### Phase 2: AI-Powered Intelligence
- **Related Documents**:
  - `mission.md` (Competitive Differentiation section)
  - `roadmap.md` (Phase 2 details)
- **Planned Implementation Areas**:
  - New AI service (planned)
  - `backend/src/ai/` (planned)
  - Integration points with existing services

## Technical Stack Cross-References

### Frontend Technology
- **Related Documents**:
  - `tech-stack.md` (Frontend Technology section)
  - `mission.md` (Solution Approach section)
- **Implementation Files**:
  - `frontend/src/app/`
  - `frontend/src/components/`
  - `frontend/src/lib/`

### Backend Services
- **Related Documents**:
  - `tech-stack.md` (Backend Services section)
  - `decisions.md` (DEC-004)
- **Implementation Files**:
  - `backend/src/index.ts`
  - `backend/src/api/`
  - `backend/src/auth.ts`

### Worker Service
- **Related Documents**:
  - `tech-stack.md` (Worker Service section)
  - `decisions.md` (DEC-006)
- **Implementation Files**:
  - `worker/src/worker.ts`
  - `worker/src/transcode.ts`

### Edge Service
- **Related Documents**:
  - `tech-stack.md` (Edge Service section)
  - `decisions.md` (DEC-005)
- **Implementation Files**:
  - `edge/src/index.ts`
  - `edge/src/sign.ts`

## Agent OS Integration Points

### Best Practices
- **Related Documents**:
  - `.agent-os/standards/best-practices.md`
  - All product documentation files
- **Implementation Guidelines**:
  - Follow Core Principles in all implementations
  - Apply DRY principles in code organization
  - Maintain Docs Discipline with all changes

### Code Style
- **Related Documents**:
  - `.agent-os/standards/code-style.md`
  - Language-specific style guides
- **Implementation Guidelines**:
  - TypeScript: `.agent-os/standards/code-style/typescript-style.md`
  - Follow indentation and naming conventions consistently

### Testing Guidelines
- **Related Documents**:
  - `.agent-os/standards/best-practices.md#testing-guidelines`
  - Service-specific test directories
- **Implementation Guidelines**:
  - Backend: `backend/tests/`
  - Edge: `edge/tests/`
  - Follow ≥80% coverage target for changed code
  - Use Playwright MCP for end-to-end testing
  - Use Sequential Thinking MCP for test planning

### MCP Tools Integration
- **Related Documents**:
  - `.agent-os/standards/best-practices.md#mcp-usage`
  - `docs/ai/codex-cli-guidance.md`
  - `docs/deploy/digitalocean.md`
- **Implementation Guidelines**:
  - DigitalOcean MCP for infrastructure management
  - GitHub MCP for code repository operations
  - Ref/Exa MCP for documentation and research
  - Playwright MCP for browser automation
  - Sentry MCP for error tracking
  - Sequential Thinking MCP for complex planning

## External Documentation Links

### Service Documentation
- **Related Files**:
  - `frontend/AGENTS.md`
  - `backend/AGENTS.md`
  - `worker/AGENTS.md`
  - `edge/AGENTS.md`

### Deployment Guide
- **Related Files**:
  - `docs/deploy/digitalocean.md`
  - `deploy/do-app.yaml`

### Configuration
- **Related Files**:
  - `docs/configuration/env.md`
  - Service-specific `.env.example` files

### Architecture Details
- **Related Files**:
  - `docs/architecture/services-plan.md`
  - All product documentation files

### MCP Tools Documentation
- **Related Files**:
  - `mcp-tools-guide.md` (Comprehensive MCP tools reference)
  - `.agent-os/standards/best-practices.md#mcp-usage`
  - `docs/ai/codex-cli-guidance.md`
  - `docs/deploy/digitalocean.md`

## Maintenance Cross-References

### Documentation Updates
- **When to Update**:
  - New architectural decisions (`decisions.md`)
  - Development phases completed (`roadmap.md`)
  - Technical stack changes (`tech-stack.md`)
  - Product vision shifts (`mission.md`)

### Related Update Points
- **Decision History**: Always update `decisions.md` with new architectural choices
- **Roadmap Progress**: Mark completed features in `roadmap.md`
- **Technical Accuracy**: Keep `tech-stack.md` aligned with actual implementation
- **Mission Alignment**: Update `mission.md` when product vision evolves

## AI Agent Usage Guide

### Context Loading
- **Primary Context**: `mission-lite.md` for lightweight product understanding
- **Technical Constraints**: `tech-stack.md` and `decisions.md` for implementation boundaries
- **Feature Priorities**: `roadmap.md` for development sequencing
- **Override Authority**: `decisions.md` for highest-priority directives

### Navigation Patterns
1. **Feature Implementation**: Start with `roadmap.md` → relevant `decisions.md` → `tech-stack.md` → service-specific documentation
2. **Bug Fixing**: Start with error context → relevant service documentation → `tech-stack.md` → `decisions.md`
3. **New Development**: Start with `mission.md` → `roadmap.md` → `tech-stack.md` → `decisions.md`

This cross-reference guide helps ensure that all documentation is interconnected and that both human developers and AI agents can efficiently navigate between related concepts and implementation details.