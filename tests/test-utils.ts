import { BrowserContext, Page } from '@playwright/test';

import type { api as Api } from '../src/api/api';

declare const api: typeof Api;

export const config = {
  baseUrl: process.env.E2E_BASE_URL as string,
  account: {
    email: process.env.E2E_USER_EMAIL as string,
    password: process.env.E2E_USER_PASSWORD as string,
    token: process.env.E2E_USER_TOKEN as string,
  },
  github: {
    email: process.env.E2E_USER_EMAIL as string,
    password: process.env.E2E_USER_GITHUB_PASSWORD as string,
    totpKey: process.env.E2E_USER_GITHUB_TOTP_KEY as string,
  },
};

export function assert(condition: boolean, error?: Error): asserts condition {
  if (!condition) {
    throw error ?? new Error('Assertion failed');
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pathname(page: Page) {
  return new URL(page.url()).pathname;
}

export async function authenticate(page: Page) {
  await page.goto('/');

  await page.evaluate((token) => {
    window.localStorage.setItem('access-token', token);
  }, config.account.token);

  await page.goto('/');
}

export async function deleteKoyebResources(page: Page) {
  await page.evaluate(async () => {
    const listAppIds = async () => {
      const { apps } = await api.listApps({ query: { limit: '100' } });
      return apps!.map((app) => app.id!);
    };

    for (const appId of await listAppIds()) {
      await api.deleteApp({ path: { id: appId } });
    }

    while ((await listAppIds()).length > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  });
}

export async function catchNewPage(context: BrowserContext, fn: () => Promise<void>) {
  const promise = context.waitForEvent('page');

  await fn();

  return promise;
}
