import { Pool } from 'pg';

const pgUrl = process.env.POSTGRES_URL || process.env.POSTGRES_TEST_URL;

// Production database pool
let pool: Pool | undefined;

if (pgUrl) {
  pool = new Pool({
    connectionString: pgUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export { pool };