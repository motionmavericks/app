# Contributing to Motion Mavericks

Thank you for your interest in contributing to this project!

## Development Setup

1. Clone the repository
2. Copy `.env.example` files to `.env` in each service directory
3. Install dependencies: `make install`
4. Start development servers: `make dev`

## Code Style

- Run `make lint` before committing
- Run `make typecheck` to verify TypeScript
- Follow existing code patterns

## Testing

- Write tests for new features
- Run tests with `npm run test` in each service
- Ensure all tests pass before submitting PR

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests and linting
5. Commit with clear message
6. Push to your fork
7. Open a Pull Request

## Questions?

Open an issue for discussion before making large changes.