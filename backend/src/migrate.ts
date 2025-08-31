import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error('POSTGRES_URL missing');
  const pool = new Pool({ connectionString: url });
  const ddlPath = resolve(process.cwd(), '../database/schema.sql');
  const sql = readFileSync(ddlPath, 'utf8');
  await pool.query(sql);
  await pool.end();
  console.log('Migration applied');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

