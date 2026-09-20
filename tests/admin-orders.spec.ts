import { expect, test } from '@playwright/test';

const base = { createdAt: '2026-09-20T10:00:00.000Z', status: 'PAID', customer: { name: 'Kupec', email: 'kupec@example.test' }, seller: 'Demo administrator', ticketStatus: { valid: 1, cancelled: 0 }, payment: { status: 'SUCCEEDED' } };
const orders = [
  { ...base, id: 'online', reference: 'NAR-ONLINE', kind: 'MATCH', channel: 'ONLINE', amount: 15, quantity: 1, issuedCount: 1, entitlementCount: 0, payment: { status: 'SUCCEEDED', method: 'DEMO' }, event: { id: 'evt', opponent: 'NK Triglav Kranj', competition: '2. SNL', kickoff: '2026-10-01T16:00:00.000Z' } },
  { ...base, id: 'box', reference: 'BLA-BOX', kind: 'MATCH', channel: 'BOX_OFFICE', amount: 10, quantity: 1, issuedCount: 1, entitlementCount: 0, payment: { status: 'SUCCEEDED', method: 'CASH' }, event: { id: 'evt', opponent: 'NK Triglav Kranj', competition: '2. SNL', kickoff: '2026-10-01T16:00:00.000Z' } },
  { ...base, id: 'free', reference: 'BREZ-FREE', kind: 'MATCH', channel: 'COMPLIMENTARY', amount: 0, quantity: 1, issuedCount: 1, entitlementCount: 0, payment: { status: 'NOT_REQUIRED' }, event: { id: 'evt', opponent: 'NK Triglav Kranj', competition: '2. SNL', kickoff: '2026-10-01T16:00:00.000Z' } },
  { ...base, id: 'season', reference: 'SEZ-SEASON', kind: 'SEASON', channel: 'ONLINE', amount: 240, quantity: 2, issuedCount: 2, entitlementCount: 2, payment: { status: 'SUCCEEDED', method: 'DEMO' }, seasonProduct: { id: 'season', name: 'Sezonska vstopnica', season: '2026/27' } },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/session', (route) => route.fulfill({ json: { authenticated: true, role: 'club_admin', clubId: 'nd_beltinci' } }));
});

test('renders online, box-office, complimentary, and season orders without secret material', async ({ page }) => {
  await page.route('**/api/admin/orders', (route) => route.fulfill({ json: { orders } }));
  await page.goto('/admin/narocila');
  await expect(page.locator('.order-row')).toHaveCount(4);
  await expect(page.locator('.order-channel.complimentary')).toHaveText('BREZPLAČNO');
  await expect(page.getByText('0,00 €', { exact: true })).toBeVisible();
  await expect(page.getByText('Sezonska vstopnica · 2026/27')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/paymentSecret|accessToken|credential|ndb_/i);
});

test('renders deliberate empty and safe error states', async ({ page }) => {
  await page.route('**/api/admin/orders', (route) => route.fulfill({ json: { orders: [] } }));
  await page.goto('/admin/narocila');
  await expect(page.getByText('NAROČIL ŠE NI')).toBeVisible();
  await page.route('**/api/admin/orders', (route) => route.fulfill({ status: 500, json: { error: 'SQL private details' } }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'NAROČIL NI MOGOČE NALOŽITI.' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('SQL private details');
});
