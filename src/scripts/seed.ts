import 'dotenv/config';
import argon2 from 'argon2';
import { maria, transaction } from '../mariadb.js';
import { CLUB } from '../domain.js';

if (process.env.NODE_ENV === 'production') throw new Error('Development seed is prohibited in production.');
const staff = [
  ['staff-dev-admin','admin@ndbeltinci.test','Demo administrator','club_admin','BeltinciDev!2026'],
  ['staff-dev-box','blagajna@ndbeltinci.test','Demo blagajnik','box_office','BeltinciDev!2026'],
  ['staff-dev-gate','vhod@ndbeltinci.test','Demo varnostnik','gate_staff','BeltinciDev!2026']
];
const fixtures = [['evt-mura','beltinci-mura','NŠ Mura','POKAL PIVOVARNA UNION — DEMO','2026-10-14T16:30:00'],['evt-triglav','beltinci-triglav','NK Triglav Kranj','DRUGA LIGA — DEMO','2026-10-25T18:00:00'],['evt-tabor','beltinci-tabor','Tabor Sežana','DRUGA LIGA — DEMO','2026-11-08T14:00:00'],['evt-ilirija','beltinci-ilirija','ND Ilirija 1911','DRUGA LIGA — DEMO','2026-11-22T14:00:00']];
await transaction(async c => {
  await c.query('INSERT INTO clubs(id,name,created_at) VALUES(?,?,UTC_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE name=name',[CLUB,'ND Beltinci']);
  for (const [id,email,name,role,password] of staff) { const passwordHash=await argon2.hash(password,{type:argon2.argon2id}); await c.query('INSERT INTO staff_users(id,club_id,email,password_hash,display_name,role,active,created_at,updated_at) VALUES(?,?,?,?,?,?,1,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)',[id,CLUB,email,passwordHash,name,role]); }
  for (const [eventId,slug,opponent,competition,kickoffRaw] of fixtures) {
    const kickoff = new Date(kickoffRaw); const salesStart = new Date('2026-08-15T08:00:00Z'); const salesEnd = new Date(kickoff.getTime()-3600000);
    await c.query('INSERT INTO events(id,club_id,slug,opponent,competition,kickoff,sales_start,sales_end,sales_open,created_at,venue_name,demo,base_sold,base_scanned,base_revenue_cents) VALUES(?,?,?,?,?,?,?,?,1,UTC_TIMESTAMP(6),?,1,0,0,0) ON DUPLICATE KEY UPDATE id=id',[eventId,CLUB,slug,opponent,competition,kickoff,salesStart,salesEnd,'Športni park Beltinci']);
    const types=[['Tribuna','Odrasli',1500,500],['Tribuna','Mladi',500,500],['Stojišče','Odrasli',1000,2000],['Stojišče','Mladi',0,2000]];
    for(let n=0;n<types.length;n++){const [section,name,price,capacity]=types[n]!;await c.query('INSERT INTO ticket_types(id,event_id,club_id,section,name,price_cents,capacity,sold,active) VALUES(?,?,?,?,?,?,?,0,1) ON DUPLICATE KEY UPDATE id=id',[`${eventId}-${n}`,eventId,CLUB,section,name,price,capacity]);}
  }
  await c.query('INSERT INTO season_products(id,club_id,name,season,price_cents,active) VALUES(?,?,?,?,?,1) ON DUPLICATE KEY UPDATE name=name',['season-beltinci-2026-27',CLUB,'Sezonska vstopnica','2026/27',12000]);
});
await maria().end();
console.log('MariaDB development fixture ensured.');
