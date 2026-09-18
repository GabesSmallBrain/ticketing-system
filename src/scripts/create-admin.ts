import argon2 from 'argon2';
import { maria, transaction } from '../mariadb.js';
import { CLUB, id } from '../domain.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Club administrator';
const clubId = process.env.BOOTSTRAP_CLUB_ID?.trim() || CLUB;
if (!email || !password || password.length < 14) throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a 14+ character BOOTSTRAP_ADMIN_PASSWORD.');
if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address.');
const hash = await argon2.hash(password, { type: argon2.argon2id });
await transaction(async (connection) => { const club = await connection.query('SELECT id FROM clubs WHERE id = ? FOR UPDATE', [clubId]); if (!club.length) throw new Error('Bootstrap club does not exist in MariaDB.'); const existing = await connection.query('SELECT id FROM staff_users WHERE club_id = ? AND email = ? FOR UPDATE', [clubId, email]); if (existing.length) throw new Error('An administrator with this email already exists for the club.'); await connection.query('INSERT INTO staff_users(id,club_id,email,password_hash,display_name,role,active,created_at,updated_at) VALUES(?,?,?,?,?,?,1,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6))', [id(), clubId, email, hash, displayName, 'club_admin']); });
await maria().end();
console.log('Administrator created in MariaDB. Remove bootstrap environment variables now.');
