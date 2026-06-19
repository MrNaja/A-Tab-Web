import { defineConfig, devices } from '@playwright/test';

const WEBPAGE_URL = 'http://127.0.0.1:4177';

export default defineConfig({
  testDir: './e2e-tests',
  testMatch: 'webpage.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: 'node e2e-tests/support/webpage-server.mjs',
    url: WEBPAGE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  },
  use: {
    baseURL: WEBPAGE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'webpage-desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webpage-mobile',
      use: { ...devices['Pixel 7'] }
    }
  ]
});
