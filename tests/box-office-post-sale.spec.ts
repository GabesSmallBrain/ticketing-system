import { expect, test } from '@playwright/test';

test('completed POS sale is authoritative, cannot repeat, and resets cleanly', async ({ page }) => {
  const event = { id: 'pos-event', slug: 'pos-event', clubId: 'nd_beltinci', opponent: 'NK Triglav Kranj', competition: '2. SNL', venue: 'Športni park Beltinci', kickoff: '2026-09-20T14:00:00.000Z', salesOpen: true };
  const types = [
    { id: 'adult', eventId: event.id, clubId: event.clubId, section: 'Tribuna', name: 'Odrasli', price: 10, capacity: 10, sold: 2, active: true },
    { id: 'youth', eventId: event.id, clubId: event.clubId, section: 'Tribuna', name: 'Mladi', price: 5, capacity: 10, sold: 1, active: true },
  ];
  let eventReads = 0;
  let saleRequests = 0;
  await page.route('**/api/session', (route) => route.fulfill({ json: { authenticated: true, role: 'box_office', clubId: event.clubId, user: { displayName: 'QA blagajnik' } } }));
  await page.route('**/api/events', (route) => { eventReads += 1; return route.fulfill({ json: { events: [event], ticketTypes: types } }); });
  await page.route('**/api/box-office', async (route) => {
    saleRequests += 1;
    const request = route.request().postDataJSON() as { items: Array<{ ticketTypeId: string; quantity: number }>; paymentMethod: string; admit: boolean };
    await new Promise((resolve) => setTimeout(resolve, 80));
    for (const line of request.items) types.find((type) => type.id === line.ticketTypeId)!.sold += line.quantity;
    const amount = request.items.reduce((sum, line) => sum + types.find((type) => type.id === line.ticketTypeId)!.price * line.quantity, 0);
    const tickets = request.items.flatMap((line) => Array.from({ length: line.quantity }, (_, index) => ({ id: `${line.ticketTypeId}-${saleRequests}-${index}`, reference: `VST-${saleRequests}-${index}` })));
    return route.fulfill({ status: 201, json: { order: { id: `order-${saleRequests}`, reference: `BLA-${saleRequests}`, eventId: event.id, amount, items: request.items.map((line) => ({ ...line, price: types.find((type) => type.id === line.ticketTypeId)!.price })) }, tickets } });
  });

  await page.goto('/admin/blagajna');
  const plus = page.getByRole('button', { name: '+' });
  await plus.nth(0).click();
  await plus.nth(0).click();
  await plus.nth(1).click();
  await page.getByRole('button', { name: /KARTICA/ }).click();
  await page.locator('.ref-complete').evaluate((button: HTMLButtonElement) => { button.click(); button.click(); button.click(); });

  await expect(page.getByRole('heading', { name: 'PRODAJA USPEŠNA' })).toBeVisible();
  await expect(page.getByText('Tribuna Odrasli')).toBeVisible();
  await expect(page.getByText('2 × 10,00')).toBeVisible();
  await expect(page.getByText('Tribuna Mladi')).toBeVisible();
  await expect(page.getByText('1 × 5,00')).toBeVisible();
  await expect(page.getByText('25,00 €')).toBeVisible();
  await expect(page.getByText('Kartica · zunanji terminal')).toBeVisible();
  expect(saleRequests).toBe(1);
  expect(eventReads).toBe(2);

  await page.getByRole('button', { name: 'NOVA PRODAJA' }).click();
  await expect(page.getByRole('heading', { name: 'PRODAJA USPEŠNA' })).toHaveCount(0);
  await expect(page.locator('.ref-quantity output')).toHaveText(['0', '0']);
  await expect(page.locator('.ref-total-slab strong')).toHaveText('0,00 €');
  await expect(page.getByText('6 prostih mest')).toBeVisible();
  await expect(page.getByText('8 prostih mest')).toBeVisible();
  await expect(page.locator('.ref-payment-toggle .selected')).toContainText('GOTOVINA');

  await page.getByRole('button', { name: '+' }).first().click();
  await page.locator('.ref-complete').click();
  await expect(page.getByRole('heading', { name: 'PRODAJA USPEŠNA' })).toBeVisible();
  expect(saleRequests).toBe(2);
});

test('sell and admit success is explicit and final ticket becomes sold out', async ({ page }) => {
  const event = { id: 'final-event', slug: 'final-event', clubId: 'nd_beltinci', opponent: 'ND Ilirija 1911', competition: '2. SNL', venue: 'Športni park Beltinci', kickoff: '2026-09-20T14:00:00.000Z', salesOpen: true };
  const type = { id: 'final', eventId: event.id, clubId: event.clubId, section: 'Tribuna', name: 'Zadnja mesta', price: 12, capacity: 5, sold: 4, active: true };
  await page.route('**/api/session', (route) => route.fulfill({ json: { authenticated: true, role: 'box_office', clubId: event.clubId } }));
  await page.route('**/api/events', (route) => route.fulfill({ json: { events: [event], ticketTypes: [type] } }));
  await page.route('**/api/box-office', (route) => { type.sold = 5; return route.fulfill({ status: 201, json: { order: { id: 'admit-order', reference: 'BLA-ADMIT', eventId: event.id, amount: 12, items: [{ ticketTypeId: type.id, quantity: 1, price: 12 }] }, tickets: [{ id: 'admitted-ticket', reference: 'VST-ADMIT' }] } }); });

  await page.goto('/admin/blagajna');
  await page.getByRole('button', { name: '+', exact: true }).click();
  await page.locator('.ref-admit').click();
  await expect(page.getByText('PRODAJA IN VSTOP ZAKLJUČENA')).toBeVisible();
  await expect(page.getByText(/vstop je že evidentiran/)).toBeVisible();
  await page.getByRole('button', { name: 'NOVA PRODAJA' }).click();
  await expect(page.getByText('0 prostih mest')).toBeVisible();
  await expect(page.locator('.ref-pos-ticket')).toHaveClass(/sold-out/);
  await expect(page.locator('.ref-quantity-plus')).toBeDisabled();
});
