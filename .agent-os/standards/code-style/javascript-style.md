# JavaScript Style Guide

## Context

Rules for JavaScript in Agent OS projects. This repo primarily uses TypeScript; JS guidance applies to TS too unless superseded by the TypeScript guide.

## General
- Semicolons required at statement ends.
- Prefer single quotes; use template literals for interpolation or multi‑line.
- Use `const` by default; use `let` only when reassigning; never `var`.
- Prefer early returns and guard clauses to reduce nesting.
- One logical operation per line; keep lines under ~100 chars when reasonable.

## Imports
- Order: Node core (with `node:` prefix) → third‑party → local modules.
- Group by origin with one blank line between groups.
- One module per import line; sort named imports alphabetically.

Example:
```js
import { hostname } from 'node:os';
import pino from 'pino';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { someLocal } from '../lib/some-local';
```

## Functions
- Use arrow functions for inline callbacks; use named functions for exported utilities.
- Keep functions small and focused; extract complex branches.
- Async: prefer `async/await`; handle failures with `try { ... } catch (e) { ... }`.

Example (guard clauses + async):
```js
app.post('/api/presign', async (request, reply) => {
  const body = request.body || {};
  if (!body.key) return reply.code(400).send({ error: 'Missing key' });
  if (!body.contentType) return reply.code(400).send({ error: 'Missing contentType' });
  // ...
});
```

## Errors and Logging
- Throw `Error` with clear messages; avoid silent catches.
- Log operational errors with context using the service logger (e.g., `pino`).

Example (exponential backoff):
```js
async function retry(fn, attempts = 3, base = 400) {
  for (let i = 0; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      if (i >= attempts) throw e;
      const jitter = Math.floor(base * Math.pow(2, i) * (0.5 + Math.random()));
      await new Promise(r => setTimeout(r, jitter));
    }
  }
}
```

## Data and Security
- Validate external inputs; enforce allow‑lists for content types/values.
- Avoid path traversal by rejecting `..` and absolute paths in keys.
- Do not log secrets; redact tokens and keys.

## Formatting Examples From This Repo
```js
// Template literal for interpolation
const message = `${path}|${exp}`;

// Timing‑safe equality
return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig));
```
