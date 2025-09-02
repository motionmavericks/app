# Code Style Guide

## Context

Global code style rules for Agent OS projects.

<conditional-block context-check="general-formatting">
IF this General Formatting section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using General Formatting rules already in context"
ELSE:
  READ: The following formatting rules

## General Formatting

### Indentation
- JS/TS: Use 2 spaces for indentation (never tabs)
- Python: Use 4 spaces for indentation (never tabs)
- Maintain consistent indentation throughout files
- Align nested structures for readability

### Naming Conventions
- Methods and Variables: JS/TS use camelCase (e.g., `userProfile`, `calculateTotal`); Python use snake_case (e.g., `user_profile`, `calculate_total`)
- Classes and Modules: Use PascalCase (e.g., `UserProfile`, `PaymentProcessor`)
- Constants: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### String Formatting
- JS/TS: Use single quotes for strings: `'Hello World'`
- JS/TS: Use backtick template literals for interpolation or multi-line strings
- JS/TS: Use double quotes only when required by content (e.g., quoting within quotes)
- Python: Prefer f-strings for interpolation (e.g., `f"Hello {name}"`); use triple quotes for multi-line strings

### Code Comments
- Add brief comments above non-obvious business logic
- Document complex algorithms or calculations
- Explain the "why" behind implementation choices
- Never remove existing comments unless removing the associated code
- Update comments when modifying code to maintain accuracy
- Keep comments concise and relevant
</conditional-block>

## Examples From This Repo

### Constants, Naming, and Strings (Backend TS)
```ts
// UPPER_SNAKE_CASE constant; single-quoted strings
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// camelCase function name; guard clause; single quotes
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  return argon2.hash(password, ARGON2_OPTIONS);
}
```

### Template Literals and Timing-safe Compare (Edge TS)
```ts
const message = `${path}|${exp}`; // template literal for interpolation
const expectedSig = crypto.createHmac('sha256', secret).update(message).digest('hex');
return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig));
```

### Comments and Guard Clauses (Fastify App)
```ts
// Health check endpoint (concise, intent-focused comment)
app.get('/api/health', async (_req, reply) => {
  reply.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Validate inputs with early returns
app.post('/api/presign', async (request, reply) => {
  const body = request.body as any;
  if (!body.key) return reply.code(400).send({ error: 'Missing key' });
  if (!body.contentType) return reply.code(400).send({ error: 'Missing contentType' });
  // ...
});
```

### Indentation and Interfaces (TypeScript)
```ts
interface BuildOptions { // PascalCase type/interface name
  logger?: boolean;
}

export async function build(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts); // 2-space indentation throughout
  return app;
}
```

<conditional-block task-condition="html-css-tailwind" context-check="html-css-style">
IF current task involves writing or updating HTML, CSS, or TailwindCSS:
  IF html-style.md AND css-style.md already in context:
    SKIP: Re-reading these files
    NOTE: "Using HTML/CSS style guides already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get HTML formatting rules from code-style/html-style.md"
        REQUEST: "Get CSS and TailwindCSS rules from code-style/css-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ the following style guides (only if not already in context):
        - @.agent-os/standards/code-style/html-style.md (if not in context)
        - @.agent-os/standards/code-style/css-style.md (if not in context)
    </context_fetcher_strategy>
ELSE:
  SKIP: HTML/CSS style guides not relevant to current task
</conditional-block>

<conditional-block task-condition="javascript" context-check="javascript-style">
IF current task involves writing or updating JavaScript:
  IF javascript-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using JavaScript style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get JavaScript style rules from code-style/javascript-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/javascript-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: JavaScript style guide not relevant to current task
</conditional-block>

<conditional-block task-condition="typescript" context-check="typescript-style">
IF current task involves writing or updating TypeScript:
  IF typescript-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using TypeScript style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get TypeScript style rules from code-style/typescript-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/typescript-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: TypeScript style guide not relevant to current task
</conditional-block>
<conditional-block task-condition="python" context-check="python-style">
IF current task involves writing or updating Python:
  IF python-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using Python style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get Python style rules from code-style/python-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/python-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: Python style guide not relevant to current task
</conditional-block>

## Code Style Organization
- Separate language-specific guides live under `~/.agent-os/standards/code-style/` (base installation) and under your project at `.agent-os/standards/code-style/`.
- Examples: `html-style.md`, `css-style.md`, `javascript-style.md`, `typescript-style.md`, `python-style.md`.
- This file references language guides via conditional blocks so agents only load what’s relevant to the current task.
- Important: Updates to your base installation do NOT automatically propagate to existing projects. Copy changes into the project’s `.agent-os/standards/` when you want them applied here.
