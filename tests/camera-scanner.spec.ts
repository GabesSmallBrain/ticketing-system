import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    jsQR?: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
    __ndbCameraStops?: number;
  }
}

async function login(page: Page, label: RegExp) {
  await page.goto('/demo-login');
  await page.getByRole('button', { name: label }).click();
  await page.waitForURL(/\/(admin(?:\/blagajna)?|scanner)$/);
}

async function issueTicket(page: Page) {
  await login(page, /BLAGAJNIK/);
  return page.evaluate(async () => {
    const response = await fetch('/api/box-office', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventId: 'evt-mura', ticketTypeId: 'evt-mura-0', quantity: 1, paymentMethod: 'CASH', admit: false })
    });
    return response.json();
  });
}

async function openScanner(page: Page) {
  await page.getByRole('button', { name: 'VHOD 3 — TRIBUNA' }).click();
  await page.getByRole('button', { name: 'ZAČNI SKENIRANJE' }).click();
  await expect(page.getByRole('heading', { name: 'SKENIRAJ VSTOPNICO' })).toBeVisible();
}

test('a generated ticket QR round-trips through the delivered browser decoder and admission endpoint', async ({ page }) => {
  const issued = await issueTicket(page);
  await login(page, /VARNOSTNIK/);
  const result = await page.evaluate(async ({ ticketId }) => {
    const { qr } = await fetch(`/api/tickets/${ticketId}/qr`).then((response) => response.json());
    const decoded = await new Promise<string>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context || !window.jsQR) return reject(new Error('QR decoder is unavailable'));
        context.drawImage(image, 0, 0);
        const decoded = window.jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        if (!decoded) return reject(new Error('QR image could not be decoded'));
        resolve(decoded.data);
      };
      image.onerror = () => reject(new Error('QR image failed to load'));
      image.src = qr;
    });
    const scan = (credential: string) => fetch('/api/scans', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: 'evt-mura', gate: 'Vhod 3 — Tribuna', credential }) }).then((response) => response.json());
    return { decoded, first: await scan(decoded), second: await scan(decoded) };
  }, { ticketId: issued.tickets[0].id });
  expect(result.decoded).toBe(issued.tickets[0].credential);
  expect(result.first.result).toBe('accepted');
  expect(result.second.result).toBe('already_used');
});

test('camera permission failure stays distinct from ticket rejection and manual fallback remains available', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined }));
  await login(page, /VARNOSTNIK/);
  await openScanner(page);
  await page.getByRole('button', { name: 'OMOGOČI KAMERO' }).click();
  await expect(page.getByText('Skeniranje s kamero v tem brskalniku ni na voljo. Uporabite ročni vnos kode.')).toBeVisible();
  await page.getByRole('button', { name: 'ROČNI VNOS KODE' }).click();
  await expect(page.getByRole('button', { name: 'PREVERI' })).toBeVisible();
});

test('a decoded camera frame sends one admission request while validation is in progress and tracks stop on exit', async ({ page }) => {
  const issued = await issueTicket(page);
  await page.addInitScript((credential) => {
    const track = { stop: () => { window.__ndbCameraStops = (window.__ndbCameraStops || 0) + 1; } };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [track] }) } });
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', { configurable: true, get: () => null, set: () => undefined });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: () => Promise.resolve() });
    Object.defineProperty(window, 'BarcodeDetector', { configurable: true, value: class { async detect() { return [{ rawValue: credential }]; } } });
  }, issued.tickets[0].credential);
  await login(page, /VARNOSTNIK/);
  await openScanner(page);
  let validations = 0;
  page.on('request', (request) => { if (request.url().endsWith('/api/scans')) validations += 1; });
  await page.getByRole('button', { name: 'OMOGOČI KAMERO' }).click();
  await expect(page.getByRole('heading', { name: 'VELJAVNA VSTOPNICA' })).toBeVisible();
  expect(validations).toBe(1);
  await expect(page.getByRole('heading', { name: 'VSTOPNICA JE ŽE UPORABLJENA' })).toBeVisible({ timeout: 6_000 });
  expect(validations).toBe(2);
  await page.getByRole('button', { name: 'SPREMENI VHOD' }).click();
  expect(await page.evaluate(() => window.__ndbCameraStops)).toBe(1);
});
