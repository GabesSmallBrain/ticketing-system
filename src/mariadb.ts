import 'dotenv/config';
import mariadb, { type Pool, type PoolConnection } from 'mariadb';

const port = Number(process.env.DB_PORT ?? 3306);
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter((name) => !process.env[name]);
if (required.length) throw new Error(`MariaDB configuration missing: ${required.join(', ')}`);

let pool: Pool | undefined;
export const maria = () => pool ??= mariadb.createPool({ host: process.env.DB_HOST, port, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10), connectTimeout: 10_000 });
export async function transaction<T>(work: (connection: PoolConnection) => Promise<T>) { const connection = await maria().getConnection(); try { await connection.beginTransaction(); const result = await work(connection); await connection.commit(); return result; } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); } }
