import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { maria, transaction } from '../mariadb.js';
const directory = join(process.cwd(), 'mariadb-migrations');
// Trusted repository migrations only: the directory is fixed and this CLI is never exposed by HTTP.
const filename = /^\d{3}_[a-z0-9_]+\.sql$/;
const migrations = (await readdir(directory)).filter((name) => filename.test(name)).sort();
await maria().query('CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(255) PRIMARY KEY, applied_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))');
for (const name of migrations) await transaction(async (connection) => { const rows = await connection.query('SELECT 1 FROM schema_migrations WHERE name = ? FOR UPDATE', [name]); if (rows.length) return; const sql = await readFile(join(directory, name), 'utf8'); for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean)) await connection.query(statement); await connection.query('INSERT INTO schema_migrations(name) VALUES (?)', [name]); console.log(`Applied ${name}`); });
await maria().end();
