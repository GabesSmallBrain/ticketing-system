import { Pool, type PoolClient } from 'pg';
import { config } from './config.js';

let pool: Pool | undefined;
export function postgres() {
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required for PostgreSQL persistence.');
  pool ??= new Pool({ connectionString: config.databaseUrl, ssl: config.isProduction ? { rejectUnauthorized: true } : undefined });
  return pool;
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await postgres().connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
