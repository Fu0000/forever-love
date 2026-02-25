import { defineConfig } from '@playwright/test';

const port = process.env.E2E_PORT ?? '5173';
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const webServer = process.env.E2E_WEB_SERVER === '1'
  ? {
      command: `npm run dev --prefix frontend -- --host 0.0.0.0 --port ${port} --strictPort`,
      url: baseURL,
      // Avoid accidentally reusing another project's dev server on the same port.
      // Set E2E_REUSE_SERVER=1 if you explicitly want reuse.
      reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
      timeout: 120_000,
    }
  : undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer,
});
