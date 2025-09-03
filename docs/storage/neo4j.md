# Neo4j Graph Database for MotionMavericks

## Overview

Neo4j serves as the graph database layer for MotionMavericks Media Asset Management, complementing PostgreSQL by excelling at relationship queries, recommendations, and complex traversals. The graph model captures the rich connections between assets, users, projects, and metadata.

## Connection Configuration

### Environment Variables
- `NEO4J_URI` - Database connection URI (default: `neo4j://localhost:7687`)
- `NEO4J_USERNAME` - Database username (default: `neo4j`)
- `NEO4J_PASSWORD` - Database password
- `NEO4J_DATABASE` - Target database name (optional, default: `neo4j`)

### Secure Connections
- Use `neo4j+s://` URIs for secure connections where possible
- Configure SSL/TLS certificates for production environments
- Enable authentication and role-based access control

## Graph Data Model

### Core Node Types

#### Asset
Primary media content with rich metadata:
```cypher
(:Asset {
  id: string,              // Unique identifier
  title: string,           // Human-readable title
  type: string,            // video|image|audio|document
  status: string,          // pending|processing|active|archived|deleted
  size: integer,           // File size in bytes
  duration: integer,       // Duration in seconds (video/audio)
  mime_type: string,       // MIME type
  created_at: datetime,    // Creation timestamp
  s3_staging_key: string,  // S3 staging location
  s3_masters_key: string,  // S3 masters location
  width: integer,          // Video/image width
  height: integer,         // Video/image height
  framerate: float,        // Video framerate
  bitrate: integer         // Video bitrate
})
```

#### User  
System users with roles and activity tracking:
```cypher
(:User {
  id: string,              // Unique identifier
  email: string,           // Email address (unique)
  display_name: string,    // Display name
  role: string,            // Admin|Creator|Editor|Viewer
  department: string,      // User department
  status: string,          // active|inactive|pending
  created_at: datetime     // Account creation date
})
```

#### Collection
Logical groupings of related assets:
```cypher
(:Collection {
  id: string,              // Unique identifier
  name: string,            // Collection name
  description: string,     // Optional description
  created_at: datetime     // Creation timestamp
})
```

#### Project
Business context for asset organization:
```cypher
(:Project {
  id: string,              // Unique identifier
  name: string,            // Project name
  description: string,     // Project description
  status: string,          // planning|active|on_hold|completed|cancelled
  created_at: datetime,    // Creation timestamp
  deadline: datetime       // Optional deadline
})
```

#### Tag
Metadata labels for categorization:
```cypher
(:Tag {
  id: string,              // Unique identifier
  name: string,            // Tag name
  category: string,        // content_type|quality|priority|status|custom
  color: string,           // Hex color code
  description: string      // Optional description
})
```

#### Version
Asset version history tracking:
```cypher
(:Version {
  id: string,              // Unique identifier
  version_number: integer, // Version number
  description: string,     // Version description
  created_at: datetime,    // Creation timestamp
  file_size: integer,      // File size in bytes
  s3_key: string          // S3 storage location
})
```

#### Preview
Generated previews and thumbnails:
```cypher
(:Preview {
  id: string,              // Unique identifier
  type: string,            // thumbnail|hls_playlist|hls_segment|proxy_video
  status: string,          // pending|processing|ready|failed
  s3_key: string,          // S3 storage location
  width: integer,          // Preview width (if applicable)
  height: integer,         // Preview height (if applicable)
  created_at: datetime     // Creation timestamp
})
```

#### Permission
Access control definitions:
```cypher
(:Permission {
  id: string,              // Unique identifier
  type: string,            // view|download|edit|delete|admin
  level: string,           // read|write|admin
  description: string      // Permission description
})
```

### Key Relationships

#### Content Relationships
- `(:User)-[:CREATED {timestamp}]->(:Asset)` - Asset creation
- `(:Asset)-[:BELONGS_TO {added_at}]->(:Collection)` - Collection membership
- `(:Asset)-[:BELONGS_TO_PROJECT {added_at}]->(:Project)` - Project association
- `(:Asset)-[:TAGGED_WITH {tagged_at, tagged_by}]->(:Tag)` - Asset tagging

#### Version & Preview Relationships  
- `(:Asset)-[:HAS_VERSION {created_at, is_current}]->(:Version)` - Version tracking
- `(:Asset)-[:HAS_PREVIEW {created_at}]->(:Preview)` - Preview association
- `(:Asset)-[:DERIVED_FROM {relationship, created_at}]->(:Asset)` - Asset lineage

#### Access Control
- `(:User)-[:HAS_PERMISSION {granted_at, granted_by, expires_at}]->(:Permission)` - User permissions

#### Activity Tracking
- `(:User)-[:VIEWED {timestamp, duration, ip_address}]->(:Asset)` - View tracking
- `(:User)-[:DOWNLOADED {timestamp, file_size, ip_address}]->(:Asset)` - Download tracking

## Common Query Patterns

### 1. Find Assets Created by User in Time Range
```cypher
MATCH (u:User {email: "creator@motionmavericks.com"})-[c:CREATED]->(a:Asset)
WHERE c.timestamp >= datetime("2024-03-01T00:00:00Z") 
  AND c.timestamp <= datetime("2024-03-31T23:59:59Z")
RETURN a.title, a.type, a.created_at
ORDER BY c.timestamp DESC;
```

### 2. Track Asset Lineage
```cypher
MATCH (final:Asset {id: "asset-3"})-[:DERIVED_FROM*]->(source:Asset)
RETURN source.title, source.type, source.created_at
ORDER BY source.created_at;
```

### 3. Content Recommendations by Shared Tags
```cypher
MATCH (target:Asset {id: "asset-1"})-[:TAGGED_WITH]->(tag:Tag)<-[:TAGGED_WITH]-(related:Asset)
WHERE target <> related
WITH related, count(tag) as shared_tags
MATCH (target)-[:BELONGS_TO]->(col:Collection)<-[:BELONGS_TO]-(related)
WITH related, shared_tags, count(col) as shared_collections
RETURN related.title, shared_tags, shared_collections, 
       (shared_tags + shared_collections) as relevance_score
ORDER BY relevance_score DESC LIMIT 10;
```

### 4. User Access Control Check
```cypher
MATCH (asset:Asset {id: "asset-1"})<-[:BELONGS_TO]-(collection:Collection)
MATCH (user:User)-[:HAS_PERMISSION]->(perm:Permission)
WHERE perm.type IN ["view", "download", "edit"]
RETURN DISTINCT user.email, user.role, collect(perm.type) as permissions;
```

### 5. Popular Assets Analytics
```cypher
MATCH (u:User)-[activity:VIEWED|DOWNLOADED]->(a:Asset)
WHERE activity.timestamp >= datetime() - duration({days: 30})
WITH a, type(activity) as activity_type, count(*) as activity_count
RETURN a.title, a.type, activity_type, activity_count
ORDER BY activity_count DESC LIMIT 20;
```

### 6. Assets Missing Previews
```cypher
MATCH (a:Asset)
WHERE NOT (a)-[:HAS_PREVIEW]->(:Preview)
RETURN a.id, a.title, a.type, a.created_at
ORDER BY a.created_at DESC;
```

### 7. Project Progress Summary
```cypher
MATCH (p:Project {id: "project-1"})<-[:BELONGS_TO_PROJECT]-(a:Asset)
RETURN a.status, count(a) as asset_count
ORDER BY asset_count DESC;
```

### 8. Most Active Content Creators
```cypher
MATCH (u:User)-[:CREATED]->(a:Asset)
WITH u, count(a) as assets_created
WHERE assets_created > 0
RETURN u.email, u.display_name, u.department, assets_created
ORDER BY assets_created DESC LIMIT 10;
```

### 9. Urgent Assets Needing Attention
```cypher
MATCH (a:Asset)-[:TAGGED_WITH]->(t:Tag {name: "Urgent"})
OPTIONAL MATCH (a)-[:HAS_PREVIEW]->(p:Preview)
RETURN a.title, a.created_at, 
       CASE WHEN p IS NULL THEN "Missing Previews" ELSE "Has Previews" END as preview_status
ORDER BY a.created_at DESC;
```

### 10. User Activity Summary
```cypher
MATCH (u:User {email: "viewer@motionmavericks.com"})
OPTIONAL MATCH (u)-[v:VIEWED]->(a1:Asset)
OPTIONAL MATCH (u)-[d:DOWNLOADED]->(a2:Asset)
OPTIONAL MATCH (u)-[c:CREATED]->(a3:Asset)
RETURN u.display_name,
       count(DISTINCT v) as views,
       count(DISTINCT d) as downloads, 
       count(DISTINCT c) as created_assets;
```

## Visual Graph Model

```
    [User]
      |
   CREATED
      ↓
   [Asset] ─── TAGGED_WITH ──→ [Tag]
      |
  BELONGS_TO ──→ [Collection]
      |
BELONGS_TO_PROJECT ──→ [Project]
      |
  HAS_VERSION ──→ [Version]
      |
  HAS_PREVIEW ──→ [Preview]
      |
  DERIVED_FROM ──→ [Asset] (lineage)
      ↑
   VIEWED/DOWNLOADED
      |
    [User]
```

## Use Cases

### Content Discovery & Recommendations
- **Tag-based recommendations**: Find assets with shared metadata tags
- **User behavior analysis**: Recommend based on viewing/download patterns
- **Asset lineage tracking**: Discover source materials and derivatives
- **Collection exploration**: Surface related content from same collections

### Analytics & Reporting
- **Usage analytics**: Track most viewed/downloaded assets
- **User activity monitoring**: Measure engagement and productivity
- **Content lifecycle**: Monitor asset status progression
- **Project progress**: Track deliverable completion rates

### Access Control & Security
- **Permission validation**: Verify user access rights
- **Activity auditing**: Log and track user actions
- **Content governance**: Ensure proper asset visibility
- **Compliance reporting**: Generate access and usage reports

### Content Management
- **Asset organization**: Manage collections and projects
- **Version control**: Track asset evolution and changes
- **Preview management**: Monitor thumbnail and proxy generation
- **Metadata enrichment**: Enhance discoverability through tagging

## Performance Considerations

### Indexing Strategy
- **Node constraints**: Unique identifiers on all primary nodes
- **Property indexes**: Frequent query properties (created_at, status, type)
- **Text indexes**: Full-text search on titles and descriptions
- **Relationship indexes**: Activity timestamps for analytics queries

### Query Optimization
- Use `EXPLAIN` and `PROFILE` for performance analysis
- Limit relationship traversal depth with bounded expansions
- Prefer parameterized queries for better caching
- Use `WITH` clauses to manage intermediate result cardinality

### Data Volume Management
- Implement time-based partitioning for activity relationships
- Archive old activity data while preserving aggregates
- Use read replicas for analytics workloads
- Monitor memory usage and tune accordingly

## Integration with PostgreSQL

### Complementary Data Storage
- **PostgreSQL**: Transactional data, user auth, file metadata
- **Neo4j**: Relationships, recommendations, complex queries
- **Data sync**: Maintain consistency through event-driven updates

### Hybrid Query Patterns
1. **Primary lookup**: PostgreSQL for asset metadata
2. **Relationship queries**: Neo4j for connections and recommendations
3. **Analytics**: Neo4j for complex traversals and patterns
4. **Reporting**: Combine results from both databases

### Sync Strategies
- **Event-driven**: Update graph on PostgreSQL changes
- **Batch processing**: Periodic full synchronization
- **Change data capture**: Stream database changes to graph
- **API-mediated**: Update both systems through service layer

## Modeling Guidelines

### Node Design
- Define explicit node labels for clear semantics
- Add constraints for identifiers and uniqueness requirements
- Index frequently matched properties for performance
- Include created_at timestamps for temporal queries

### Relationship Design
- Use descriptive relationship types (CREATED vs OWNS)
- Store relationship metadata as properties when needed
- Avoid fan-out relationships that create Cartesian products
- Consider relationship direction for query efficiency

### Data Consistency
- Implement upsert patterns with MERGE clauses
- Use transactions for multi-node operations
- Handle concurrent updates with appropriate locking
- Validate data integrity through constraints

## Query Validation

### Performance Testing
- Run `EXPLAIN` for query execution plans
- Use `PROFILE` to measure actual query performance
- Confirm index usage and cardinality estimates
- Monitor memory consumption for large result sets

### Query Patterns
- Avoid unbounded variable-length patterns
- Use limits and pagination for large datasets
- Prefer pattern comprehension for aggregations
- Leverage APOC procedures judiciously with security review

## Migrations

### Schema Evolution
- **Stage-first approach**: Apply changes in staging environment
- **Verification**: Confirm node/relationship counts and performance
- **Batched operations**: Process large datasets in chunks
- **Idempotent scripts**: Allow safe re-execution of migration scripts

### Data Migration
- **Resume markers**: Track progress for long-running migrations  
- **Rollback procedures**: Prepare inverse operations where feasible
- **Data validation**: Verify integrity after migration completion
- **Performance monitoring**: Ensure queries remain performant

### Best Practices
- Version control all schema changes
- Test migrations with production-sized datasets
- Document breaking changes and compatibility requirements
- Coordinate with application deployment schedules

## Implementation Examples

The graph database implementation is located in `/backend/src/graph/`:

- **connection.ts**: Neo4j driver setup and connection management
- **models.ts**: TypeScript type definitions for graph entities
- **operations.ts**: Core CRUD and query operations
- **index.ts**: Public API and convenience functions

### Basic Usage
```typescript
import { initNeo4j, getGraphOperations } from './graph';

// Initialize connection
await initNeo4j();

// Get operations instance
const graph = getGraphOperations();

// Create asset
await graph.upsertAsset({
  id: 'asset-1',
  title: 'Sample Video',
  type: 'video',
  status: 'active',
  // ... other properties
});

// Link to creator
await graph.linkAssetCreator('asset-1', 'user-1');

// Get recommendations
const recommendations = await graph.getRecommendations({
  asset_id: 'asset-1',
  based_on: 'tags',
  limit: 10
});
```

See also:
- [Schema Definition](/docs/storage/neo4j-schema.cypher)
- [Graph Architect Agent](/.claude/agents/graph-architect.md)
- [Graph Migration Agent](/.claude/agents/graph-ops-migrator.md)
- [Multi-Agent System](/docs/ai/claude-subagents.md)