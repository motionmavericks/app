# TypeScript Style Guide

## Context

TypeScript rules for Agent OS projects. Complements the JavaScript guide; where rules conflict, this file wins for TS.

## Types First
- Prefer `interface` for object shapes; use `type` for unions, aliases, and mapped/conditional types.
- Exported functions must declare explicit return types.
- Use `unknown` instead of `any`; narrow with type guards or schema validators (e.g., Zod).

Example:
```ts
interface BuildOptions { // PascalCase
  logger?: boolean;
}

export async function build(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);
  return app;
}
```

## Modules and Imports
- Use ES Modules; prefer Node core imports with `node:` prefix (e.g., `import { spawn } from 'node:child_process'`).
- Order imports: core → third‑party → local. Group with blank lines.

## Declarations and Variables
- Use `const` by default; `let` only when reassigning.
- Avoid non‑null assertions (`!`); prefer explicit checks and early returns.
- Use literal unions over enums for simple sets: `type VariantLabel = '360p' | '480p' | '720p' | '1080p'`.

## Functions
- Keep functions small; prefer early returns.
- Mark functions `async` when awaiting; avoid mixing `.then()` with `await`.
- Pass typed parameters and return `Promise<T>` where applicable.

Example (from worker):
```ts
type Variant = { label: string; height: number; bw: number };

function variantSet(labels: string[]): Variant[] {
  const map: Record<string, Variant> = {
    '360p': { label: '360p', height: 360, bw: 800000 },
    '480p': { label: '480p', height: 480, bw: 1400000 },
    '720p': { label: '720p', height: 720, bw: 2800000 },
    '1080p': { label: '1080p', height: 1080, bw: 5000000 },
  };
  const result: Variant[] = [];
  for (const l of labels) if (map[l]) result.push(map[l]);
  return result.length ? result : [map['720p']];
}
```

## Error Handling
- Narrow error types (e.g., `catch (e: unknown)` then refine).
- Provide actionable messages; include identifiers/keys but never secrets.

## Environment and Runtime
- Treat `process.env` values as `string | undefined`; validate and coerce (e.g., `Number(...)`, defaulting carefully).
- Avoid throwing on optional features; prefer feature detection with clear logs.

Example:
```ts
const healthPort = process.env.WORKER_HEALTH_PORT ? Number(process.env.WORKER_HEALTH_PORT) : undefined;
if (healthPort && Number.isFinite(healthPort)) { /* start server */ }
```

## Formatting
- Semicolons required; 2‑space indentation; single quotes; template literals for interpolation.
- Keep public APIs typed and minimal; avoid exporting internal helpers unless reused.

