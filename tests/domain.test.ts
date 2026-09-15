import test from 'node:test';
import assert from 'node:assert/strict';
import { CLUB, credential, issueTickets, redeem } from '../src/domain.js';
import { seed } from '../src/db.js';

test('a valid ticket is accepted once and then rejected atomically', async () => {
  const db = seed(); const type = db.ticketTypes[0]!; const order = { id: 'o1', reference: 'NAR-TEST', accessToken: 'access-1', paymentSecret: 'payment-1', clubId: CLUB, eventId: 'evt-mura', customer: { firstName: 'A', lastName: 'B', email: 'a@example.test' }, channel: 'ONLINE' as const, status: 'PAID' as const, amount: 15, createdAt: new Date().toISOString(), paymentStatus: 'SUCCEEDED' as const, items: [{ ticketTypeId: type.id, quantity: 1, price: 15 }] };
  db.orders.push(order); const [ticket] = issueTickets(db, order); const answers = await Promise.all([Promise.resolve().then(() => redeem(db, CLUB, 'evt-mura', 'Vhod 1', ticket!.credential)), Promise.resolve().then(() => redeem(db, CLUB, 'evt-mura', 'Vhod 3', ticket!.credential))]);
  assert.equal(answers.filter((x) => x.result === 'accepted').length, 1); assert.equal(answers.filter((x) => x.result === 'already_used').length, 1);
});
test('invalid, cancelled and wrong-event credentials are rejected', () => {
  const db = seed(); assert.equal(redeem(db, CLUB, 'evt-mura', 'Vhod 1', 'bad').result, 'invalid'); const order = { id: 'o2', reference: 'NAR-TEST2', accessToken: 'access-2', paymentSecret: 'payment-2', clubId: CLUB, eventId: 'evt-mura', customer: { firstName: 'A', lastName: 'B', email: 'a@example.test' }, channel: 'ONLINE' as const, status: 'PAID' as const, amount: 15, createdAt: new Date().toISOString(), paymentStatus: 'SUCCEEDED' as const, items: [{ ticketTypeId: 'evt-mura-0', quantity: 1, price: 15 }] }; db.orders.push(order); const [ticket] = issueTickets(db, order); assert.equal(redeem(db, CLUB, 'evt-triglav', 'Vhod 1', ticket!.credential).result, 'wrong_event'); ticket!.status = 'CANCELLED'; assert.equal(redeem(db, CLUB, 'evt-mura', 'Vhod 1', ticket!.credential).result, 'cancelled');
});
test('ticket issuance is idempotent for duplicated payment callback', () => {
  const db = seed(); const order = { id: 'o3', reference: 'NAR-TEST3', accessToken: 'access-3', paymentSecret: 'payment-3', clubId: CLUB, eventId: 'evt-mura', customer: { firstName: 'A', lastName: 'B', email: 'a@example.test' }, channel: 'ONLINE' as const, status: 'PAID' as const, amount: 30, createdAt: new Date().toISOString(), paymentStatus: 'SUCCEEDED' as const, items: [{ ticketTypeId: 'evt-mura-0', quantity: 2, price: 15 }] }; db.orders.push(order); assert.equal(issueTickets(db, order).length, 2); assert.equal(issueTickets(db, order).length, 2); assert.equal(db.tickets.length, 2); assert.match(credential(), /^ndb_[A-Za-z0-9_-]{32}$/);
});
test('a credential cannot cross a tenant boundary', () => {
  const db = seed(); const order = { id: 'o4', reference: 'NAR-TEST4', accessToken: 'access-4', paymentSecret: 'payment-4', clubId: CLUB, eventId: 'evt-mura', customer: { firstName: 'A', lastName: 'B', email: 'a@example.test' }, channel: 'ONLINE' as const, status: 'PAID' as const, amount: 15, createdAt: new Date().toISOString(), paymentStatus: 'SUCCEEDED' as const, items: [{ ticketTypeId: 'evt-mura-0', quantity: 1, price: 15 }] }; db.orders.push(order); const [ticket] = issueTickets(db, order); assert.equal(redeem(db, 'club_demo_fc', 'evt-mura', 'Vhod 1', ticket!.credential).result, 'invalid');
});
