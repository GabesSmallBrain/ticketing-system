import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, label: string | RegExp) {
  await page.goto('/demo-login');
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/demo-login') && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: label }).click();
  const completed = await response;
  await page.waitForURL(/\/(admin(?:\/blagajna)?|scanner)$/);
  return completed;
}

test('customer pages execute without browser errors and render Beltinci content', async ({ page }) => {
  const errors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => errors.push(error));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByText('Beltinčani na domačem terenu.')).toBeVisible();
  await page.goto('/demo-login');
  await expect(page.getByRole('heading', { name: 'KDO STE?' })).toBeVisible();
  await page.getByRole('button', { name: /ADMINISTRATOR/ }).click();
  await expect(page.getByRole('heading', { name: 'ND BELTINCI — NŠ MURA' })).toBeVisible();
  await page.goto('/scanner');
  await expect(page.getByRole('heading', { name: 'Priprava skenerja' })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'ND BELTINCI — NŠ MURA' })).toBeVisible();
  await page.goto('/admin/blagajna');
  await expect(page.getByRole('heading', { name: 'BELTINCI — NŠ MURA' })).toBeVisible();
  await page.goto('/sezonske');
  await expect(page.getByText('V vseh domačih trenutkih skupaj.')).toBeVisible();
  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('club_admin cookie grants dashboard and box-office access', async ({ page, context }) => {
  const response = await login(page, /ADMINISTRATOR/);
  expect(response.status()).toBe(200);
  const setCookie = (await response.allHeaders())['set-cookie'] || '';
  expect(setCookie).toContain('ndb_demo_session=');
  expect(setCookie).toContain('Path=/');
  expect(setCookie).toContain('HttpOnly');
  expect(setCookie).toContain('SameSite=Lax');
  await expect(page.getByRole('heading', { name: 'ND BELTINCI — NŠ MURA' })).toBeVisible();
  const state = await page.evaluate(() => fetch('/api/demo/session').then((response) => response.json()));
  expect(state).toMatchObject({ authenticated: true, role: 'club_admin', clubId: 'club_beltinci' });
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === 'ndb_demo_session')).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
  expect(await page.evaluate(() => fetch('/api/admin/dashboard').then((response) => response.status))).toBe(200);
  await page.goto('/admin/blagajna');
  await expect(page.getByRole('heading', { name: 'BELTINCI — NŠ MURA' })).toBeVisible();
});

test('box_office cannot access dashboard but can access box office', async ({ page }) => {
  await login(page, /BLAGAJNIK/);
  await page.goto('/admin/blagajna');
  await expect(page.getByRole('heading', { name: 'BELTINCI — NŠ MURA' })).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  await page.getByRole('button', { name: '+' }).first().click();
  await page.getByRole('button', { name: '+' }).nth(1).click();
  await expect(page.getByText('35,00 €')).toBeVisible();
  await page.getByRole('button', { name: 'GOTOVINA' }).click();
  await expect(page.getByRole('heading', { name: 'PRODAJA USPEŠNA' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'NATISNI VSTOPNICE' })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByText('Nekaj ni uspelo')).toBeVisible();
  expect(await page.evaluate(() => fetch('/api/admin/dashboard').then((response) => response.status))).toBe(403);
});

test('gate_staff can scan but cannot access admin or box office', async ({ page }) => {
  await login(page, /VARNOSTNIK/);
  await expect(page.getByRole('heading', { name: 'Priprava skenerja' })).toBeVisible();
  await page.getByRole('button', { name: 'VHOD 3 — TRIBUNA' }).click();
  await page.getByRole('button', { name: 'ZAČNI SKENIRANJE' }).click();
  await expect(page.getByRole('heading', { name: 'SKENIRAJ VSTOPNICO' })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByText('Nekaj ni uspelo')).toBeVisible();
  await page.goto('/admin/blagajna');
  await expect(page.getByText('Nekaj ni uspelo')).toBeVisible();
  expect(await page.evaluate(() => fetch('/api/admin/dashboard').then((response) => response.status))).toBe(403);
});

test('gate staff admits a box-office ticket once and rejects the duplicate', async ({ page }) => {
  await login(page, /BLAGAJNIK/);
  const issued = await page.evaluate(async () => {
    const response = await fetch('/api/box-office', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', ticketTypeId: 'evt-mura-0', quantity: 1, paymentMethod: 'CASH', admit: false }) });
    return response.json();
  });
  await login(page, /VARNOSTNIK/);
  await page.getByRole('button', { name: 'VHOD 3 — TRIBUNA' }).click();
  await page.getByRole('button', { name: 'ZAČNI SKENIRANJE' }).click();
  await page.getByRole('button', { name: 'ROČNI VNOS KODE' }).click();
  const input = page.getByPlaceholder('ndb_…');
  await input.fill(issued.tickets[0].credential);
  await page.getByRole('button', { name: 'PREVERI' }).click();
  await expect(page.getByRole('heading', { name: 'VELJAVNA VSTOPNICA' })).toBeVisible();
  await page.getByRole('button', { name: 'NADALJUJ SKENIRANJE' }).click();
  await input.fill(issued.tickets[0].credential);
  await page.getByRole('button', { name: 'PREVERI' }).click();
  await expect(page.getByRole('heading', { name: 'VSTOPNICA JE ŽE UPORABLJENA' })).toBeVisible();
});

test('role switch replaces the old cookie session', async ({ page }) => {
  await login(page, /ADMINISTRATOR/);
  await expect(page.getByRole('heading', { name: 'ND BELTINCI — NŠ MURA' })).toBeVisible();
  await login(page, /VARNOSTNIK/);
  await expect(page.getByRole('heading', { name: 'Priprava skenerja' })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByText('Nekaj ni uspelo')).toBeVisible();
});

test('staff logout invalidates the server session and returns to the public shop', async ({ page }) => {
  await login(page, /ADMINISTRATOR/);
  await page.getByRole('button', { name: 'ODJAVA' }).click();
  await page.waitForURL('/');
  await expect(page.getByText('NASLEDNJA DOMAČA TEKMA')).toBeVisible();
  expect(await page.evaluate(() => fetch('/api/admin/dashboard').then((response) => response.status))).toBe(403);
});

test('protected admin API rejects a fresh context', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => fetch('/api/admin/dashboard').then((response) => response.status))).toBe(403);
});
