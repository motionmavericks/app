# Forms & Validation

Libraries
- react-hook-form + Zod; server mirrors Zod schema.

Patterns
- Inline validation; disable submit until valid; optimistic UI where safe.

Schemas (examples)
```ts
const ShareSchema = z.object({
  assetId: z.string().uuid(),
  password: z.string().min(8).optional(),
  allowDownload: z.boolean().default(false),
  expiresAt: z.date().optional(),
});
```

Acceptance
- Errors are announced; server rejects invalid payloads with field codes.
