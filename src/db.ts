import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { CLUB, type Database, type Event, type TicketType } from './domain.js';

const file = join(process.cwd(), 'data', 'demo.json');
let lock = Promise.resolve();
export async function readDb(): Promise<Database> { try { return JSON.parse(await readFile(file, 'utf8')) as Database; } catch { return seed(); } }
export async function mutate<T>(work: (db: Database) => T | Promise<T>): Promise<T> {
  let release!: () => void; const previous = lock; lock = new Promise<void>((resolve) => { release = resolve; }); await previous;
  try { const db = await readDb(); const value = await work(db); await mkdir(dirname(file), { recursive: true }); const temp = `${file}.tmp`; await writeFile(temp, JSON.stringify(db, null, 2)); await rename(temp, file); return value; } finally { release(); }
}
export async function reset(): Promise<void> { await mutate((db) => Object.assign(db, seed())); }
export function seed(): Database {
  const event = (id: string, slug: string, opponent: string, kickoff: string, competition = 'DRUGA LIGA — DEMO'): Event => ({ id, clubId: CLUB, slug, opponent, kickoff, competition, venue: 'Športni park Beltinci', salesStart: '2026-08-15T08:00:00.000Z', salesEnd: new Date(new Date(kickoff).getTime() - 60 * 60 * 1000).toISOString(), salesOpen: true, demo: true, baseSold: id === 'evt-mura' ? 1137 : 170, baseScanned: id === 'evt-mura' ? 742 : 80, baseRevenue: id === 'evt-mura' ? 13245 : 1820 });
  const events = [event('evt-mura', 'beltinci-mura', 'NŠ Mura', '2026-10-14T16:30:00', 'POKAL PIVOVARNA UNION — DEMO'), event('evt-triglav', 'beltinci-triglav', 'NK Triglav Kranj', '2026-10-25T18:00:00'), event('evt-tabor', 'beltinci-tabor', 'Tabor Sežana', '2026-11-08T14:00:00'), event('evt-ilirija', 'beltinci-ilirija', 'ND Ilirija 1911', '2026-11-22T14:00:00')];
  const ticketTypes: TicketType[] = events.flatMap((item) => [['Tribuna', 'Odrasli', 15, 500], ['Tribuna', 'Mladi', 5, 500], ['Stojišče', 'Odrasli', 10, 2000], ['Stojišče', 'Mladi', 0, 2000]].map(([section, name, price, capacity], index) => ({ id: `${item.id}-${index}`, eventId: item.id, clubId: CLUB, section: String(section), name: String(name), price: Number(price), capacity: Number(capacity), sold: item.id === 'evt-mura' ? [390, 44, 680, 23][index]! : 20, active: true })));
  return { clubs: [{ id: CLUB, name: 'ND Beltinci' }, { id: 'club_demo_fc', name: 'Demo FC' }], events, ticketTypes, orders: [], tickets: [], audits: [] };
}
