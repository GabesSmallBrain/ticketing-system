import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3000', headless: true },
  webServer: { command: 'npm run build && npm run start', url: 'http://127.0.0.1:3000', reuseExistingServer: true }
});
