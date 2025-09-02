# Tech Stack

## Context

Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

- App Framework: Next.js 15 (App Router)
- Language: TypeScript 5.5+ / JavaScript (ES Modules)
- Primary Database: PostgreSQL 15+ (Managed)
- ORM: None (direct pg client + SQL migrations)
- JavaScript Framework: React 19
- Build Tool: Next.js Turbopack (frontend); TypeScript tsc (backend/edge/worker)
- Import Strategy: ES Modules (NodeNext)
- Package Manager: npm
- Node Version: 20 LTS (Alpine images)
- CSS Framework: TailwindCSS 4.0+
- UI Components: Radix UI primitives + custom components; Lucide React
- UI Installation: Via npm packages
- Font Provider: next/font
- Font Loading: Self-hosted via next/font
- Icons: Lucide React components
- Application Hosting: DigitalOcean App Platform + Droplets (Edge/GPU)
- Hosting Region: syd1 (close to Wasabi ap-southeast-2)
- Database Hosting: DigitalOcean Managed PostgreSQL
- Database Backups: Managed automated backups (restore drills documented)
- Asset Storage: Wasabi S3-compatible (ap-southeast-2)
- CDN: Optional DO CDN for static; custom Edge cache for HLS
- Asset Access: Private with presigned URLs + HMAC-signed edge URLs
- CI/CD Platform: GitHub Actions
- CI/CD Trigger: Push to main; deploy workflow (manual or on build completion)
- Tests: Vitest (backend/edge) run on changed paths in CI
- Production Environment: main branch
- Staging Environment: Not yet configured (add ‘staging’ branch when needed)
