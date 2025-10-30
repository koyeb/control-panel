import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(import.meta.dirname, 'tests', '.env'),
  quiet: true,
});

const ci = process.env.CI === 'true';
const baseURL = process.env.BASE_URL ?? 'https://staging.koyeb.com';

const oneClickApps = process.env.ONE_CLICK_APP !== undefined;

export default defineConfig({
  testDir: './tests',
  globalTimeout: 25 * 60 * 1000,
  forbidOnly: !!ci,
  retries: ci && !oneClickApps ? 2 : 0,
  workers: 1,
  reporter: ci ? [['list'], ['github']] : 'list',

  grep: oneClickApps ? /one-click-apps/ : undefined,
  grepInvert: oneClickApps ? undefined : /one-click-apps/,

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});
