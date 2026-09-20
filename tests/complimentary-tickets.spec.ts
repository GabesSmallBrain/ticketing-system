import { expect, test } from '@playwright/test';

const event = { id: 'evt', clubId: 'nd_beltinci', opponent: 'NK Triglav Kranj', competition: '2. SNL', venue: 'Športni park Beltinci', kickoff: '2026-10-01T16:00:00.000Z' };
const type = { id: 'adult', eventId: event.id, clubId: event.clubId, section: 'Tribuna', name: 'Odrasli', price: 15, capacity: 10, sold: 2, active: true };

test.beforeEach(async ({ page }) => {
  await page.route('**/api/session', (route) => route.fulfill({ json: { authenticated: true, role: 'club_admin', clubId: event.clubId } }));
});

test('administrator issues complimentary tickets and sees explicit channel without credentials', async ({ page }) => {
  let issued = false;
  await page.route('**/api/admin/tickets', (route) => {
    if (route.request().method() === 'POST') return route.fallback();
    return route.fulfill({ json: { events: [event], ticketTypes: [type], tickets: issued ? [{ id: 'ticket-1', reference: 'VST-COMP', status: 'VALID', issuedAt: '2026-09-20T10:00:00.000Z', admissions: [], event, type, order: { id: 'order', reference: 'BREZ-TEST', channel: 'COMPLIMENTARY', amount: 0, issuer: 'Admin QA', customer: { firstName: 'Gost', lastName: '', email: '' } } }] : [] } });
  });
  await page.route('**/api/admin/tickets/complimentary', (route) => { issued = true; return route.fulfill({ status: 201, json: { order: { id: 'order', channel: 'COMPLIMENTARY', amount: 0 }, tickets: [{ id: 'ticket-1', reference: 'VST-COMP' }] } }); });
  await page.goto('/admin/vstopnice');
  await expect(page.getByText('VSTOPNICE ŠE NISO IZDANE')).toBeVisible();
  await page.getByRole('button', { name: 'IZDAJ BREZPLAČNE VSTOPNICE' }).click();
  await page.locator('.complimentary-form input[type="number"]').fill('1');
  await page.getByRole('button', { name: 'POTRDI IZDAJO' }).click();
  await expect(page.getByText('BREZPLAČNA IZDAJA · 0,00')).toBeVisible();
  await expect(page.getByText('BREZPLAČNA · Admin QA')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('ndb_');
});

test('ticket management renders a safe API error state', async ({ page }) => {
  await page.route('**/api/admin/tickets', (route) => route.fulfill({ status: 500, json: { error: 'SQL private details' } }));
  await page.goto('/admin/vstopnice');
  await expect(page.getByRole('heading', { name: 'VSTOPNIC NI MOGOČE NALOŽITI.' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('SQL private details');
});
