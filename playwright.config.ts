import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const ci = process.env.CI === 'true';
const baseURL = process.env.E2E_BASE_URL ?? 'https://staging.koyeb.com';

export default defineConfig({
  testDir: './tests',
  globalTimeout: 25 * 60 * 1000,
  forbidOnly: !!ci,
  retries: ci ? 2 : 0,
  workers: 1,
  reporter: ci ? [['list'], ['github']] : 'list',

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
