# Technology Stack

## Overview

The Media Asset Management platform is built on a modern, scalable technology stack emphasizing performance, security, and maintainability. Each service uses carefully selected technologies optimized for their specific responsibilities.

## Frontend Technology Stack

### Core Framework
- **Next.js 15.5.2**: React framework with server-side rendering and App Router
- **React 19.1.0**: Latest React with concurrent features and improved performance
- **TypeScript 5+**: Full type safety across the entire frontend codebase

### UI & Styling
- **Tailwind CSS 4.0**: Modern utility-first CSS framework with latest features
- **Radix UI**: Accessible, unstyled UI components
  - `@radix-ui/react-avatar` (1.1.10)
  - `@radix-ui/react-checkbox` (1.3.3)
  - `@radix-ui/react-dialog` (1.1.15)
  - `@radix-ui/react-dropdown-menu` (2.1.16)
  - `@radix-ui/react-label` (2.1.7)
  - `@radix-ui/react-progress` (1.1.7)
  - `@radix-ui/react-scroll-area` (1.2.10)
  - `@radix-ui/react-select` (2.2.6)
  - `@radix-ui/react-separator` (1.1.7)
  - `@radix-ui/react-slider` (1.3.6)
  - `@radix-ui/react-slot` (1.2.3)
  - `@radix-ui/react-switch` (1.2.6)
  - `@radix-ui/react-tabs` (1.1.13)
  - `@radix-ui/react-toggle` (1.1.10)
  - `@radix-ui/react-tooltip` (1.2.8)

### Media & Interaction
- **HLS.js 1.5.8**: HTTP Live Streaming playback for video content
- **Lucide React 0.542.0**: Modern icon library with 1000+ icons
- **class-variance-authority 0.7.1**: Type-safe component variants
- **clsx 2.1.1**: Utility for constructing className strings
- **cmdk 1.1.1**: Command palette component

### User Experience
- **next-themes 0.4.6**: Dark/light theme management
- **Sonner 2.0.7**: Toast notifications system
- **tailwind-merge 3.3.1**: Tailwind class merging utility

### Cloud Integration
- **AWS SDK v3 (3.687.0)**: S3-compatible storage integration
  - `@aws-sdk/client-s3`: Core S3 operations
  - `@aws-sdk/s3-request-presigner`: Presigned URL generation

### Development Tools
- **ESLint 9**: Modern linting with Next.js configuration
- **TypeScript**: Full type checking and IntelliSense support

## Backend API Technology Stack

### Core Framework
- **Fastify 4.28.1**: High-performance web framework for Node.js
- **Node.js 20+**: Latest LTS runtime with modern JavaScript features
- **TypeScript 5.5.4**: Complete type safety for server-side code

### Database & Storage
- **PostgreSQL (pg 8.11.5)**: Primary relational database with JSON support
- **Redis (ioredis 5.4.1)**: In-memory cache and job queue system
- **AWS SDK v3 (3.687.0)**: S3-compatible storage integration
  - `@aws-sdk/client-s3`: Core S3 operations
  - `@aws-sdk/s3-request-presigner`: Presigned URL generation

### Authentication & Security
- **JSON Web Tokens (9.0.2)**: Stateless authentication system
- **Argon2 (0.44.0)**: Modern password hashing algorithm
- **@fastify/cookie 11.0.2**: Secure cookie management
- **@fastify/cors 8.3.0**: Cross-Origin Resource Sharing configuration

### API & Documentation
- **@fastify/swagger 8.14.0**: OpenAPI specification generation
- **@fastify/swagger-ui 2.1.0**: Interactive API documentation
- **Zod 3.23.8**: Runtime type validation and parsing
- **@fastify/rate-limit 8.1.1**: Request rate limiting protection

### Environment & Configuration
- **dotenv 16.4.5**: Environment variable management
- **Pino**: Structured logging (via Fastify)

### Testing
- **Vitest 3.2.4**: Fast unit test runner with native TypeScript support
- **Integration Tests**: Comprehensive API endpoint testing

## Worker Service Technology Stack

### Core Processing
- **Node.js 20+**: Runtime for job processing and coordination
- **TypeScript 5.5.4**: Type-safe background processing
- **FFmpeg**: GPU-accelerated media processing (external dependency)
  - NVENC hardware acceleration (preferred)
  - libx264 CPU fallback for compatibility

### Queue & Communication
- **Redis (ioredis 5.4.1)**: Job queue using Redis Streams
- **Consumer Groups**: Load balancing across multiple worker instances
- **Dead Letter Queues**: Failed job handling and retry logic

### Storage Integration
- **AWS SDK v3 (3.687.0)**: S3-compatible storage operations
  - Download from Masters bucket
  - Upload to Previews bucket
  - Metadata management

### Logging & Monitoring
- **Pino 9.3.2**: High-performance structured logging
- **Health Checks**: Worker status and job processing metrics

### Development Tools
- **tsx 4.19.2**: TypeScript execution for development
- **dotenv 16.4.5**: Environment configuration management

## Edge Service Technology Stack

### Core Framework
- **Fastify 4.28.1**: High-performance content delivery service
- **Node.js 20+**: Optimized for streaming and low-latency responses
- **TypeScript 5.5.4**: Type-safe request handling

### Security & Validation
- **HMAC Signature Verification**: Built-in cryptographic validation
- **@fastify/rate-limit 8.0.0**: Protection against abuse and DDoS
- **Time-based Expiration**: Configurable URL validity periods

### Development & Testing
- **Vitest 3.2.4**: Unit test framework for validation logic
- **node-fetch 3.3.2**: HTTP client for testing integrations
- **tsx 4.19.2**: Development server with hot reloading

## Shared Infrastructure

### Database Systems
- **PostgreSQL 15+**: Primary data store with advanced JSON features
  - Connection pooling for performance
  - Automated backup and recovery
  - Migration system for schema changes
  
- **Redis 7+**: Multi-purpose in-memory data structure store
  - Session caching and management
  - Job queue with Redis Streams
  - Rate limiting counters
  - Real-time data caching

### Storage Architecture
- **Wasabi S3**: Cost-effective, S3-compatible object storage
  - Staging Bucket: Temporary upload storage
  - Masters Bucket: Immutable originals with object lock
  - Previews Bucket: Processed content for delivery
  
- **S3 Features Utilized**:
  - Presigned URLs for secure uploads
  - Object locking for data immutability
  - Lifecycle policies for cost optimization
  - Server-side encryption at rest

### Media Processing
- **FFmpeg 6+**: Industry-standard media processing
  - GPU acceleration with NVENC (NVIDIA)
  - CPU fallback with libx264
  - HLS segmentation for adaptive streaming
  - Thumbnail extraction with precise timing
  - Metadata extraction (duration, resolution, codecs)

## Development & Deployment Stack

### Development Environment
- **Node.js 20+**: Consistent runtime across all services (specified in .nvmrc)
- **TypeScript 5+**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (via ESLint integration)

### Build Tools
- **Turbopack**: Next.js 15's fast bundler for frontend
- **TypeScript Compiler**: Native tsc for backend services
- **tsx**: Development server with hot reloading
- **Docker**: Containerization for consistent deployments

### Testing Framework
- **Vitest**: Modern test runner with native TypeScript support
- **Integration Tests**: API endpoint and workflow testing
- **Unit Tests**: Component and function testing
- **Test Coverage**: Comprehensive coverage reporting

### Deployment Platform
- **DigitalOcean App Platform**: Container-based PaaS deployment
- **Docker Containers**: Consistent runtime environments
- **Environment Management**: Separate dev/staging/production configs
- **Auto-scaling**: Dynamic resource allocation based on demand

## Version Management

### Language Versions
- **Node.js**: 20+ LTS (specified in .nvmrc)
- **TypeScript**: 5.5.4 across all services
- **PostgreSQL**: 15+ for advanced features
- **Redis**: 7+ for Redis Streams support

### Package Management
- **npm**: Standard package manager with lock files
- **Semantic Versioning**: Consistent version management
- **Security Auditing**: Regular dependency vulnerability scanning

## Performance Characteristics

### Frontend Performance
- **Next.js 15**: 50% faster builds with Turbopack
- **React 19**: Concurrent features for better UX
- **Code Splitting**: Automatic optimization for bundle size
- **Static Generation**: Pre-rendered pages where applicable

### Backend Performance
- **Fastify**: 65% faster than Express.js
- **Connection Pooling**: Optimized database connections
- **Redis Caching**: Sub-millisecond data access
- **Streaming**: Efficient large file handling

### Worker Performance
- **GPU Acceleration**: 10x faster transcoding with NVENC
- **Parallel Processing**: Multiple worker instances
- **Queue Optimization**: Efficient job distribution
- **Memory Management**: Optimized for large media files

### Edge Performance
- **CDN-Ready**: Optimized for edge caching
- **Streaming**: Zero-copy content delivery
- **Signature Caching**: Efficient validation
- **Compression**: Automatic response compression

## Security Stack

### Authentication
- **JWT**: Industry-standard token authentication with refresh rotation
- **Argon2**: Winner of password hashing competition
- **HTTPS**: Encrypted communication (TLS 1.3)
- **CSRF Protection**: Built into Fastify framework

### Authorization
- **Role-Based Access**: User permission management
- **Resource Ownership**: Asset-level access control
- **IP Restrictions**: Optional IP-based limitations
- **Rate Limiting**: Abuse prevention per endpoint

### Data Security
- **Encryption at Rest**: S3 server-side encryption
- **Encryption in Transit**: HTTPS/TLS everywhere
- **HMAC Signatures**: Cryptographic URL signing
- **Input Validation**: Comprehensive with Zod schemas

## Implementation Status

### Fully Implemented (✅)
All components of this technology stack are fully implemented and production-ready:

- **All 4 services** with complete functionality
- **Authentication system** with JWT and session management
- **Media processing pipeline** with GPU acceleration
- **Secure content delivery** with HMAC validation
- **Database schema** with migrations and connection pooling
- **Testing framework** with comprehensive coverage
- **Deployment configuration** for DigitalOcean App Platform

### Current Version Alignment
The technology stack documentation now accurately reflects the actual package.json versions across all services, ensuring consistency between documentation and implementation.

This technology stack provides a robust, scalable foundation for professional media asset management with modern development practices and enterprise-grade security.