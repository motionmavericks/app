# Ops Tables (DDL Sketch)

Jobs (queue snapshot)
```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue text NOT NULL, -- preview:build, qc:loudness
  payload jsonb NOT NULL,
  state text NOT NULL, -- waiting, active, completed, failed
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Activities (audit)
```sql
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  actor_id uuid,
  verb text NOT NULL, -- promoted, shared, commented
  object_type text NOT NULL,
  object_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activities_project_time ON activities(project_id, created_at DESC);
```

Manifests (promotion copy)
```sql
CREATE TABLE manifests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  src_key text NOT NULL,
  dest_key text NOT NULL,
  sha256 char(64) NOT NULL,
  bytes bigint NOT NULL,
  promoted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
