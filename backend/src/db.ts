import { Pool } from 'pg';

const pgUrl = process.env.POSTGRES_URL;

// For tests, use mock database if PostgreSQL not available
let pool: Pool | undefined;

if (process.env.NODE_ENV === 'test' && !pgUrl) {
  // Use mock database for tests
  const mockPool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => {}
    }),
    end: async () => {}
  };
  pool = mockPool as any;
} else if (pgUrl) {
  pool = new Pool({
    connectionString: pgUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export { pool };