import { createHash, randomUUID } from 'node:crypto';
import { maria } from '../dist/mariadb.js';

const base = `http://127.0.0.1:${process.env.PORT ?? 3100}`;
const clubId = 'nd_beltinci';
const suffix = randomUUID().slice(0, 8);
const eventId = `cutover-${suffix}`;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const report = {};

const query = async (sql, args = []) => maria().query(sql, args);
const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  let value;
  try { value = await response.json(); } catch { value = {}; }
  return { status: response.status, value, cookie: response.headers.get('set-cookie')?.split(';', 1)[0] };
};
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const createType = async (label, capacity) => {
  const id = `${eventId}-${label}`;
  await query('INSERT INTO ticket_types(id,event_id,club_id,section,name,price_cents,capacity,sold,active) VALUES(?,?,?,?,?,?,?,0,1)', [id, eventId, clubId, 'Cutover', label, 1000, capacity]);
  return id;
};
const checkout = (ticketTypeId, quantity = 1) => request('/api/checkout', {
  method: 'POST',
  body: { email: `cutover-${suffix}@example.test`, firstName: 'Cutover', lastName: 'Verifier', eventId, items: [{ ticketTypeId, quantity }] }
});
const login = async (email) => {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password: 'BeltinciDev!2026' } });
  expect(result.status === 200 && result.cookie, `login failed for ${email}`);
  return result.cookie;
};
const editPayload = async () => {
  const eventData = await request(`/api/events/${eventId}`);
  const { event, ticketTypes } = eventData.value;
  return {
    opponent: event.opponent,
    competition: event.competition,
    venue: event.venue,
    kickoff: event.kickoff,
    salesStart: event.salesStart,
    salesEnd: event.salesEnd,
    salesOpen: event.salesOpen,
    ticketTypes: ticketTypes.map((type) => ({ id: type.id, price: type.price, capacity: type.capacity, active: type.active }))
  };
};

try {
  await query('INSERT INTO events(id,club_id,slug,opponent,competition,kickoff,sales_start,sales_end,sales_open,created_at,venue_name,demo,base_sold,base_scanned,base_revenue_cents) VALUES(?,?,?,?,?,UTC_TIMESTAMP(6),DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 1 DAY),DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 1 DAY),1,UTC_TIMESTAMP(6),?,1,0,0,0)', [eventId, clubId, eventId, 'Cutover verification', 'TEST', 'MariaDB verification']);
  const adminCookie = await login('admin@ndbeltinci.test');
  const boxCookie = await login('blagajna@ndbeltinci.test');
  const gateCookie = await login('vhod@ndbeltinci.test');

  const matchType = await createType('match-payment', 10);
  const matchCheckout = await checkout(matchType, 2);
  expect(matchCheckout.status === 201, 'could not create match payment order');
  const matchOrder = matchCheckout.value.order;
  const [callbackA, callbackB] = await Promise.all([
    request('/api/payments/callback', { method: 'POST', headers: { 'x-demo-payment-secret': matchOrder.paymentSecret }, body: { orderId: matchOrder.id, outcome: 'success', transaction: `cutover-payment-${suffix}` } }),
    request('/api/payments/callback', { method: 'POST', headers: { 'x-demo-payment-secret': matchOrder.paymentSecret }, body: { orderId: matchOrder.id, outcome: 'success', transaction: `cutover-payment-${suffix}` } })
  ]);
  const matchRows = {
    orders: Number((await query('SELECT COUNT(*) AS count FROM orders WHERE id=?', [matchOrder.id]))[0].count),
    orderItems: Number((await query('SELECT COUNT(*) AS count FROM order_items WHERE order_id=?', [matchOrder.id]))[0].count),
    payments: Number((await query('SELECT COUNT(*) AS count FROM payments WHERE order_id=?', [matchOrder.id]))[0].count),
    tickets: Number((await query('SELECT COUNT(*) AS count FROM tickets WHERE order_id=?', [matchOrder.id]))[0].count)
  };
  report.matchPayment = { pass: callbackA.status === 200 && callbackB.status === 200 && callbackA.value.order?.status === 'PAID' && callbackB.value.order?.status === 'PAID' && matchRows.tickets === 2, callbacks: [callbackA.status, callbackB.status], rows: matchRows };

  const scanCredential = callbackA.value.tickets?.[0]?.credential;
  expect(scanCredential, 'payment response did not materialize a ticket');
  const [scanA, scanB] = await Promise.all([
    request('/api/scans', { method: 'POST', headers: { cookie: gateCookie }, body: { eventId, gate: 'Cutover gate', credential: scanCredential } }),
    request('/api/scans', { method: 'POST', headers: { cookie: gateCookie }, body: { eventId, gate: 'Cutover gate', credential: scanCredential } })
  ]);
  const ticketId = callbackA.value.tickets[0].id;
  const admissions = Number((await query('SELECT COUNT(*) AS count FROM admissions WHERE ticket_id=?', [ticketId]))[0].count);
  const scanResults = [scanA.value.result, scanB.value.result].sort();
  report.duplicateScan = { pass: scanA.status === 200 && scanB.status === 200 && scanResults.join(',') === 'accepted,already_used' && admissions === 1, results: [scanA.value.result, scanB.value.result], admissions };

  const publicType = await createType('public-capacity', 1);
  const publicRequests = await Promise.all([checkout(publicType), checkout(publicType)]);
  const publicSuccess = publicRequests.filter((result) => result.status === 201).length;
  const publicFailed = publicRequests.length - publicSuccess;
  const publicState = (await query('SELECT capacity,sold FROM ticket_types WHERE id=?', [publicType]))[0];
  const publicTickets = Number((await query('SELECT COUNT(*) AS count FROM tickets WHERE ticket_type_id=?', [publicType]))[0].count);
  report.publicCapacity = { pass: publicSuccess === 1 && publicFailed === 1 && Number(publicState.sold) <= 1, successful: publicSuccess, failed: publicFailed, capacity: Number(publicState.capacity), sold: Number(publicState.sold), tickets: publicTickets };

  const sharedType = await createType('public-box-capacity', 1);
  const [sharedPublic, sharedBox] = await Promise.all([
    checkout(sharedType),
    request('/api/box-office', { method: 'POST', headers: { cookie: boxCookie }, body: { eventId, paymentMethod: 'CASH', items: [{ ticketTypeId: sharedType, quantity: 1 }] } })
  ]);
  const sharedState = (await query('SELECT capacity,sold FROM ticket_types WHERE id=?', [sharedType]))[0];
  const sharedTickets = Number((await query('SELECT COUNT(*) AS count FROM tickets WHERE ticket_type_id=?', [sharedType]))[0].count);
  const winner = sharedPublic.status === 201 && sharedBox.status !== 201 ? 'PUBLIC' : sharedBox.status === 201 && sharedPublic.status !== 201 ? 'BOX_OFFICE' : 'INVALID';
  report.publicBoxCapacity = { pass: winner !== 'INVALID' && Number(sharedState.sold) <= 1 && sharedTickets <= 1, winner, publicStatus: sharedPublic.status, boxOfficeStatus: sharedBox.status, capacity: Number(sharedState.capacity), sold: Number(sharedState.sold), tickets: sharedTickets };

  const accessType = await createType('access-hash', 10);
  const accessA = await checkout(accessType);
  const accessB = await checkout(accessType);
  expect(accessA.status === 201 && accessB.status === 201, 'could not create access-token orders');
  const orderA = accessA.value.order, orderB = accessB.value.order;
  const correct = await request(`/api/orders/${orderA.id}`, { headers: { 'x-order-access': orderA.accessToken } });
  const missing = await request(`/api/orders/${orderA.id}`);
  const wrong = await request(`/api/orders/${orderA.id}`, { headers: { 'x-order-access': randomUUID() } });
  const crossAB = await request(`/api/orders/${orderA.id}`, { headers: { 'x-order-access': orderB.accessToken } });
  const crossBA = await request(`/api/orders/${orderB.id}`, { headers: { 'x-order-access': orderA.accessToken } });
  const hashes = await query('SELECT access_token_hash FROM orders WHERE id IN (?,?)', [orderA.id, orderB.id]);
  const plaintextStored = hashes.some((row) => row.access_token_hash === orderA.accessToken || row.access_token_hash === orderB.accessToken);
  report.orderAccess = { pass: correct.status === 200 && [missing, wrong, crossAB, crossBA].every((result) => result.status === 404) && !plaintextStored && hashes.every((row) => /^[a-f0-9]{64}$/.test(row.access_token_hash)) && hashes.some((row) => row.access_token_hash === hash(orderA.accessToken)) && hashes.some((row) => row.access_token_hash === hash(orderB.accessToken)), correct: correct.status === 200, missingDenied: missing.status === 404, wrongDenied: wrong.status === 404, crossOrderDenied: crossAB.status === 404 && crossBA.status === 404, plaintextTokenInDatabase: plaintextStored };

  const payload = await editPayload();
  const adminEdit = await request(`/api/admin/events/${eventId}`, { method: 'PUT', headers: { cookie: adminCookie }, body: payload });
  const boxSale = await request('/api/box-office', { method: 'POST', headers: { cookie: boxCookie }, body: { eventId, paymentMethod: 'CARD', items: [{ ticketTypeId: matchType, quantity: 1 }] } });
  const boxEdit = await request(`/api/admin/events/${eventId}`, { method: 'PUT', headers: { cookie: boxCookie }, body: payload });
  const unusedCredential = callbackA.value.tickets?.[1]?.credential;
  const gateRedeem = await request('/api/scans', { method: 'POST', headers: { cookie: gateCookie }, body: { eventId, gate: 'Cutover gate', credential: unusedCredential } });
  const gateBox = await request('/api/box-office', { method: 'POST', headers: { cookie: gateCookie }, body: { eventId, paymentMethod: 'CASH', items: [{ ticketTypeId: matchType, quantity: 1 }] } });
  const gateEdit = await request(`/api/admin/events/${eventId}`, { method: 'PUT', headers: { cookie: gateCookie }, body: payload });
  const unauthBox = await request('/api/box-office', { method: 'POST', body: { eventId, paymentMethod: 'CASH', items: [{ ticketTypeId: matchType, quantity: 1 }] } });
  const unauthEdit = await request(`/api/admin/events/${eventId}`, { method: 'PUT', body: payload });
  const adminOnly = await request('/api/admin/events', { headers: { cookie: adminCookie } });
  const nonAdminOnly = await request('/api/admin/events', { headers: { cookie: boxCookie } });
  report.crossRole = { pass: adminEdit.status === 200 && boxSale.status === 201 && boxEdit.status === 403 && gateRedeem.status === 200 && gateRedeem.value.result === 'accepted' && gateBox.status === 403 && gateEdit.status === 403 && unauthBox.status === 403 && unauthEdit.status === 403 && adminOnly.status === 200 && nonAdminOnly.status === 403, adminEventEdit: adminEdit.status === 200, boxOfficeSale: boxSale.status === 201, boxOfficeEventEditDenied: boxEdit.status === 403, gateRedemption: gateRedeem.status === 200 && gateRedeem.value.result === 'accepted', gateBoxOfficeDenied: gateBox.status === 403, gateEventEditDenied: gateEdit.status === 403, unauthenticatedMutationsDenied: unauthBox.status === 403 && unauthEdit.status === 403, adminOnlyEndpoint: adminOnly.status === 200 && nonAdminOnly.status === 403, allowedMutationErrors: [adminEdit.value.error, boxSale.value.error].filter(Boolean) };

  console.log(JSON.stringify(report));
  expect(Object.values(report).every((entry) => entry.pass), 'one or more cutover objectives failed');
} finally {
  await maria().end();
}
