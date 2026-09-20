import { expect, test } from '@playwright/test';

const report = { totals: { paidTickets: 8, complimentary: 2, totalIssued: 10, admissions: 6, revenue: 80, capacity: 100, remainingCapacity: 90 }, channels: [{ channel: 'ONLINE', tickets: 5, revenue: 50 }, { channel: 'BOX_OFFICE', tickets: 3, revenue: 30 }, { channel: 'COMPLIMENTARY', tickets: 2, revenue: 0 }], matches: [{ event: { id: 'evt', opponent: 'NK Triglav Kranj', competition: '2. SNL', kickoff: '2026-10-01T16:00:00.000Z' }, paidTickets: 8, complimentary: 2, totalIssued: 10, admissions: 6, revenue: 80, capacity: 100, remainingCapacity: 90, channels: [] }], season: { orders: 1, entitlements: 2, revenue: 240, admissionsImplemented: false } };

test.beforeEach(async ({ page }) => {
  await page.route('**/api/session', (route) => route.fulfill({ json: { authenticated: true, role: 'club_admin', clubId: 'nd_beltinci' } }));
});

test('renders real reporting distinctions and separated season reporting', async ({ page }) => {
  await page.route('**/api/admin/report', (route) => route.fulfill({ json: report }));
  await page.goto('/admin/porocila');
  await expect(page.getByText('SKUPAJ IZDANO')).toBeVisible();
  await expect(page.getByText('BREZPLAČNO', { exact: true })).toBeVisible();
  await expect(page.getByText('2 IZDANIH SEZONSKIH PRAVIC')).toBeVisible();
  await expect(page.getByText(/Evidentiranje sezonskih vstopov še ni implementirano/)).toBeVisible();
  await expect(page.locator('.report-match-row')).toHaveCount(1);
});

test('renders a safe report error state', async ({ page }) => {
  await page.route('**/api/admin/report', (route) => route.fulfill({ status: 500, json: { error: 'MariaDB private detail' } }));
  await page.goto('/admin/porocila');
  await expect(page.getByRole('heading', { name: 'POROČILA NI MOGOČE NALOŽITI.' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('MariaDB private detail');
});
