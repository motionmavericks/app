# Python Style Guide

## Context

Python rules for Agent OS projects. This repo includes Python utilities (e.g., `tools/wasabi_audit.py`).

## General
- Indentation: 4 spaces; never tabs.
- Naming: snake_case for variables/functions; PascalCase for classes; UPPER_SNAKE_CASE for constants.
- Strings: prefer single quotes; use f-strings for interpolation; triple quotes for multi-line/docstrings.
- Typing: use type hints everywhere feasible; prefer `typing` and `collections` types.

## Imports
- Order: standard library → third‑party → local modules.
- One import per line; avoid wildcard imports.
- Use absolute imports for local modules when possible.

Example:
```py
import os
import json
from collections import defaultdict, Counter

import boto3
from botocore.config import Config
```

## Functions
- Keep functions focused; extract helpers when logic grows.
- Avoid mutable default arguments; use `None` and set defaults inside.
- Use early returns to reduce nesting.

Example (from tools/wasabi_audit.py):
```py
def human_bytes(n: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    size = float(n)
    for u in units:
        if size < 1024.0:
            return f"{size:.2f} {u}"
        size /= 1024.0
    return f"{size:.2f} EB"
```

## Data Structures
- Prefer `Counter` and `defaultdict` for frequency/aggregation.
- Use comprehensions for clear transformations; keep them readable.

Example:
```py
ext_counter = Counter()
group_bytes = Counter()
top_prefix = defaultdict(lambda: {"count": 0, "bytes": 0})
```

## Error Handling
- Catch specific exceptions when reasonable; avoid blanket `except:`.
- Provide actionable messages and keep context small; do not log secrets.

## Formatting
- Line length ~100 chars when practical; wrap long expressions sensibly.
- Spaces around operators; no extra whitespace inside parentheses.
- Docstrings use triple double quotes with summary line.

## CLI/Utilities
- Validate environment variables and arguments; print helpful errors to stderr.
- Exit with non‑zero status on fatal errors.

