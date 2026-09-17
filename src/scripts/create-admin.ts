import argon2 from 'argon2';
import { postgres } from '../postgres.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Club administrator';
const clubId = process.env.BOOTSTRAP_CLUB_ID?.trim() || 'club_beltinci';
if (!email || !password || password.length < 14) throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a 14+ character BOOTSTRAP_ADMIN_PASSWORD.');
const db = postgres();
const hash = await argon2.hash(password, { type: argon2.argon2id });
const result = await db.query(`INSERT INTO staff_users (id, club_id, email, password_hash, display_name, role, active, created_at, updated_at)
  VALUES (gen_random_uuid(), $1, $2, $3, $4, 'club_admin', true, now(), now())
  ON CONFLICT (club_id, email) DO NOTHING RETURNING id`, [clubId, email, hash, displayName]);
if (!result.rowCount) throw new Error('An administrator with this email already exists for the club.');
console.log('Administrator created. Remove bootstrap environment variables now.');
