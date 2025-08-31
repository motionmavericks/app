# Architecture Diagrams

System Context (C4‑1)
```mermaid
flowchart LR
  user[Client Reviewer]:::ext --> EDGE[Edge Cache\n(NVMe + Caddy)]
  editor[Producer/Editor]:::ext --> WEB[Web/API\n(Next.js)]
  admin[Admin]:::ext --> WEB

  EDGE -->|miss| PREV[(Wasabi\npreviews bucket)]
  WEB --> DB[(Managed Postgres)]
  WEB --> REDIS[(Managed Redis)]
  GPU[GPU Workers\n(ffmpeg/NVENC)] --> PREV
  GPU -->|read| MAST[(Wasabi\nmasters bucket)]
  WEB --> STAGE[(Wasabi\nstaging bucket)]
  WEB --> DOCS[(Wasabi\ndocs bucket)]

  classDef ext fill:#2b2b2b,stroke:#666,color:#fff;
```

Containers (C4‑2)
```mermaid
flowchart TB
  subgraph DO_VPC[DigitalOcean VPC]
    subgraph Edge
      EDGE[Edge Cache\nCaddy/Nginx + NVMe]
    end
    subgraph WebTier
      WEB[Next.js Web/API\nAuth, Presign, Promotion]
    end
    subgraph Workers
      GPU[GPU Transcode Workers\nBullMQ + ffmpeg]
    end
    DB[(Managed Postgres)]
    REDIS[(Managed Redis)]
  end

  WEB --> DB
  WEB --> REDIS
  WEB -->|presign| STAGE[(Wasabi staging)]
  GPU -->|read| MAST[(Wasabi masters)]
  GPU -->|write| PREV[(Wasabi previews)]
  EDGE -->|miss pull| PREV
```

Sequence — First Playback
```mermaid
sequenceDiagram
  participant B as Browser
  participant E as Edge Cache
  participant P as Previews Bucket
  participant Q as Queue/Workers
  participant M as Masters Bucket

  B->>E: GET /previews/{sha}/manifest.m3u8
  alt Cache hit
    E-->>B: 200 manifest + segments
  else Cache miss
    E->>P: GET manifest.m3u8
    alt Exists in previews
      P-->>E: 200
      E-->>B: 200 (proxied)
    else Not built yet
      E-->>B: 404 (trigger build)
      B->>Q: POST /api/preview {sha}
      Q->>M: GET master
      Q->>P: PUT HLS/MP4
      B->>E: Retry fetch → now hits
    end
  end
```

Sequence — Promotion (Staging → Masters)
```mermaid
sequenceDiagram
  participant U as Uploader
  participant W as Web/API
  participant S as Staging
  participant R as Promotion Service
  participant M as Masters

  U->>W: Request presigned URLs
  W-->>U: Multipart URLs (staging)
  U->>S: Upload parts
  U->>W: Submit promotion {mapping, checksum}
  W->>R: Promote job
  R->>S: Read object (verify sha256)
  R->>M: Copy with Object Lock headers
  R-->>W: Manifest row + success
```

