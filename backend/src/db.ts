import { Pool } from 'pg';

const pgUrl = process.env.POSTGRES_URL;

if (!pgUrl) {
  throw new Error('POSTGRES_URL environment variable is required');
}

export const pool = new Pool({
  connectionString: pgUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});