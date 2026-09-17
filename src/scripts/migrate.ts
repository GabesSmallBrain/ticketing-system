import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { postgres } from '../postgres.js';

const directory = join(process.cwd(), 'sql');
const migrations = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
const db = postgres();
await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
for (const name of migrations) {
  const applied = await db.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
  if (applied.rowCount) continue;
  await db.query('BEGIN');
  try { await db.query(await readFile(join(directory, name), 'utf8')); await db.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]); await db.query('COMMIT'); }
  catch (error) { await db.query('ROLLBACK'); throw error; }
  console.log(`Applied ${name}`);
}
