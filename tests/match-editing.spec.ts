import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, label: RegExp) {
  await page.goto('/demo-login');
  await page.getByRole('button', { name: label }).click();
  await page.waitForURL(/\/(admin(?:\/blagajna)?|scanner)$/);
}

async function eventPayload(page: Page) {
  return page.evaluate(() => fetch('/api/admin/events').then((response) => response.json()).then(({ events }) => events.find((event: { id: string }) => event.id === 'evt-mura')));
}

test('club admin persists match details, controls sales, and keeps issued tickets valid', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await login(page, /BLAGAJNIK/);
  const issued = await page.evaluate(async () => fetch('/api/box-office', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', ticketTypeId: 'evt-mura-0', quantity: 1, paymentMethod: 'CASH' }) }).then((response) => response.json()));

  await login(page, /ADMINISTRATOR/);
  await page.goto('/admin/tekme/evt-mura');
  await page.getByLabel('Nasprotnik').fill('NK Demo United');
  await page.getByLabel('Tekmovanje').fill('POKAL — DEMO');
  await page.getByLabel('Prizorišče').fill('Glavno igrišče Beltinci');
  await page.getByLabel('Datum').fill('2026-10-16');
  await page.getByLabel('Čas začetka').fill('18:15');
  await page.getByLabel('Začetek prodaje').fill('2026-08-20T09:00');
  await page.getByLabel('Konec prodaje').fill('2026-10-16T17:15');
  await page.getByRole('button', { name: 'SHRANI SPREMEMBE' }).click();
  await expect(page.getByText('✓ SPREMEMBE SHRANJENE')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'BELTINCI — NK DEMO UNITED' })).toBeVisible();
  await expect(page.getByLabel('Prizorišče')).toHaveValue('Glavno igrišče Beltinci');

  await page.goto('/');
  await expect(page.getByText('ND Beltinci — NK Demo United')).toBeVisible();
  await page.goto('/scanner');
  await expect(page.getByRole('option', { name: 'Beltinci — NK Demo United' })).toBeAttached();
  await page.goto('/admin/blagajna');
  await expect(page.getByRole('heading', { name: 'BELTINCI — NK DEMO UNITED' })).toBeVisible();

  await page.goto('/admin/tekme/evt-mura');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'USTAVI PRODAJO' }).click();
  await expect(page.getByText('✓ SPREMEMBE SHRANJENE')).toBeVisible();
  expect((await eventPayload(page)).salesOpen).toBe(false);
  const blocked = await page.evaluate(() => fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', firstName: 'Janez', lastName: 'Novak', email: 'janez@example.test', items: [{ ticketTypeId: 'evt-mura-0', quantity: 1 }] }) }).then(async (response) => ({ status: response.status, body: await response.json() })));
  expect(blocked.status).toBe(400);
  expect(blocked.body.error).toBe('Prodaja za tekmo ni odprta.');
  const boxOfficeBlocked = await page.evaluate(() => fetch('/api/box-office', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', ticketTypeId: 'evt-mura-0', quantity: 1, paymentMethod: 'CASH' }) }).then(async (response) => ({ status: response.status, body: await response.json() })));
  expect(boxOfficeBlocked.status).toBe(400);
  expect(boxOfficeBlocked.body.error).toBe('Prodaja za tekmo ni odprta.');

  await login(page, /VARNOSTNIK/);
  const admission = await page.evaluate((credential) => fetch('/api/scans', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', gate: 'Vhod 3 — Tribuna', credential }) }).then((response) => response.json()), issued.tickets[0].credential);
  expect(admission.result).toBe('accepted');

  await login(page, /ADMINISTRATOR/);
  await page.goto('/admin/tekme/evt-mura');
  await page.getByRole('button', { name: 'ODPRI PRODAJO' }).click();
  await expect(page.getByText('✓ SPREMEMBE SHRANJENE')).toBeVisible();
  expect((await eventPayload(page)).salesOpen).toBe(true);

  const invalid = await page.evaluate(async (event) => fetch('/api/admin/events/evt-mura', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...event, opponent: '' }) }).then(async (response) => ({ status: response.status, body: await response.json() })), await eventPayload(page));
  expect(invalid.status).toBe(400);
  expect(invalid.body.error).toContain('Nasprotnik');
  const invalidSchedule = await page.evaluate(async (event) => fetch('/api/admin/events/evt-mura', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...event, salesStart: '2026-10-20T10:00', salesEnd: '2026-10-19T10:00' }) }).then(async (response) => ({ status: response.status, body: await response.json() })), await eventPayload(page));
  expect(invalidSchedule.status).toBe(400);
  expect(invalidSchedule.body.error).toContain('Konec prodaje');

  await page.evaluate(() => fetch('/api/demo/reset', { method: 'POST' }));
  expect(pageErrors).toEqual([]);
});

test('box-office and gate-staff roles cannot mutate a match', async ({ page }) => {
  await login(page, /BLAGAJNIK/);
  const payload = { opponent: 'NŠ Mura', competition: 'Demo', venue: 'Beltinci', kickoff: '2026-10-14T16:30', salesStart: '2026-08-15T08:00', salesEnd: '2026-10-14T15:30', salesOpen: true };
  expect(await page.evaluate((data) => fetch('/api/admin/events/evt-mura', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }).then((response) => response.status), payload)).toBe(403);
  await login(page, /VARNOSTNIK/);
  expect(await page.evaluate((data) => fetch('/api/admin/events/evt-mura', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }).then((response) => response.status), payload)).toBe(403);
});
