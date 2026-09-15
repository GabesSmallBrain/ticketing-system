import { expect, test } from '@playwright/test';

async function resetDemo(page: import('@playwright/test').Page) {
  await page.goto('/demo-login');
  await page.getByRole('button', { name: /ADMINISTRATOR/ }).click();
  await page.waitForURL('/admin');
  await page.evaluate(() => fetch('/api/demo/reset', { method: 'POST' }));
}

test('supporter shop completes a two-ticket purchase and the shared scanner admits each credential once', async ({ page }) => {
  await resetDemo(page);
  await page.goto('/');
  await expect(page.getByText('NASLEDNJA DOMAČA TEKMA')).toBeVisible();
  await page.getByRole('link', { name: 'KUPI VSTOPNICE' }).first().click();
  await page.getByRole('button', { name: '+' }).first().click();
  await page.getByRole('button', { name: '+' }).first().click();
  await expect(page.getByRole('heading', { name: '2 VSTOPNICE' })).toBeVisible();
  await page.getByRole('link', { name: 'NADALJUJ' }).first().click();
  await expect(page.getByRole('heading', { name: 'VAŠE VSTOPNICE' })).toBeVisible();
  await page.getByRole('link', { name: 'NADALJUJ NA PLAČILO' }).click();
  await page.getByRole('textbox', { name: 'Ime', exact: true }).fill('Ana');
  await page.getByRole('textbox', { name: 'Priimek', exact: true }).fill('Navijac');
  await page.getByRole('textbox', { name: 'E-pošta', exact: true }).fill('ana@example.test');
  await page.getByRole('button', { name: /PLAČAJ/ }).click();
  await page.getByRole('button', { name: /POTRDI/ }).click();
  await expect(page.getByRole('heading', { name: 'NAKUP USPEŠEN' })).toBeVisible();
  await page.getByRole('link', { name: 'PRIKAŽI VSTOPNICE' }).click();
  await expect(page.getByRole('link', { name: 'ODPRI VSTOPNICO' })).toHaveCount(2);
  const order = await page.evaluate(async () => {
    const id = new URLSearchParams(location.search).get('order')!;
    const token = sessionStorage.getItem(`beltinci-order-${id}`)!;
    return fetch(`/api/orders/${id}`, { headers: { 'x-order-access': token } }).then((response) => response.json());
  });
  expect(order.tickets).toHaveLength(2);
  expect(order.tickets[0].credential).not.toBe(order.tickets[1].credential);
  await page.getByRole('link', { name: 'ODPRI VSTOPNICO' }).first().click();
  await expect(page.getByRole('img', { name: 'QR koda vstopnice' })).toBeVisible();
  await page.getByRole('button', { name: 'NASLEDNJA ›' }).click();
  await expect(page.getByText('VSTOPNICA 2 OD 2')).toBeVisible();
  const scanned = await page.evaluate(async (tickets) => Promise.all(tickets.map((ticket: { credential: string }) => fetch('/api/scans', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', gate: 'Vhod 1', credential: ticket.credential }) }).then((response) => response.json()))), order.tickets);
  expect(scanned.map((item: { result: string }) => item.result)).toEqual(['accepted', 'accepted']);
});

test('supporter ticket selection respects closed sales state', async ({ page }) => {
  await resetDemo(page);
  await page.evaluate(async () => {
    const event = (await fetch('/api/admin/events').then((response) => response.json())).events.find((item: { id: string }) => item.id === 'evt-mura');
    await fetch(`/api/admin/events/${event.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...event, salesOpen: false }) });
  });
  await page.goto('/vstopnice/beltinci-mura');
  await expect(page.locator('.status.closed').first()).toHaveText('PRODAJA VSTOPNIC JE ZAPRTA');
  await expect(page.getByRole('button', { name: '+' })).toHaveCount(0);
  await page.evaluate(() => fetch('/api/demo/reset', { method: 'POST' }));
});
