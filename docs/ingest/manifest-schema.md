# Ingest Manifest Schema

JSON Schema (excerpt)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["client","project","files"],
  "properties": {
    "client": {"type": "string"},
    "project": {"type": "string"},
    "shoot_date": {"type": "string", "format": "date"},
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["src","sha256","collection"],
        "properties": {
          "src": {"type": "string"},
          "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
          "collection": {"enum": ["00-project","01-footage","02-audio","03-graphics","00-exports"]}
        }
      }
    }
  }
}
```

Acceptance
- Validates via AJV; rejected manifests return first error path.
