# Product Mission (Lite)

> Last Updated: 2025-09-02
> Version: 1.0.0
> For AI Agent Consumption

## Product Mission

Motion Mavericks Creative Production Management System is an enterprise-grade creative production management platform that digitizes the entire creative workflow from initial concept to final delivery, transforming how creative teams collaborate and deliver high-quality content.

## Value Proposition

The platform solves critical inefficiencies in creative production workflows by providing:
- **Automated Media Processing**: GPU-accelerated transcoding and preview generation
- **Secure Content Delivery**: HMAC-signed URLs for controlled asset distribution
- **Collaborative Review Tools**: Frame-accurate commenting and approval workflows
- **Centralized Asset Management**: Three-tier storage architecture for efficient asset lifecycle

## Target Users

- **Motion Mavericks Internal Teams**: Project managers, editors, creative directors, account managers
- **Agency Partners**: Collaborative project stakeholders with client relationships
- **Direct Enterprise Clients**: Organizations receiving creative services directly

## Key Differentiators

1. **End-to-End Creative Workflow**: Covers ingest to delivery, not just storage
2. **Industry-Specific Design**: Built for video/photo production, not generic file management
3. **Performance Optimization**: GPU processing and streaming for large media files
4. **Collaboration-First**: Multi-party review and approval processes

## Technical Context

This is a multi-service architecture with:
- **Frontend**: Next.js 15 for upload/playback UI
- **Backend API**: Fastify for presigned URLs and asset management
- **Preview Worker**: Node.js GPU-accelerated processing
- **Edge Service**: Fastify for HMAC-signed content delivery

## Agent OS Integration

When implementing features, always reference:
- **Architectural Decisions**: `decisions.md` overrides conflicting instructions
- **Technical Stack**: `tech-stack.md` for approved technologies
- **Development Roadmap**: `roadmap.md` for feature priorities
- **Best Practices**: `.agent-os/standards/best-practices.md`
- **Code Style**: `.agent-os/standards/code-style.md`