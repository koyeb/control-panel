import { BrowserContext, Page } from '@playwright/test';
import { TOTP } from 'totp-generator';

import { api } from 'src/api/api';
import { ApiError } from 'src/api/api-errors';
import { mapOrganization } from 'src/api/mappers/session';
import type { Organization } from 'src/api/model';

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
}

export async function authenticateOnGithub(context: BrowserContext) {
  const page = await context.newPage();

  await page.goto('https://github.com/login');

  await page.getByLabel('Username or email address').fill(config.github.email);
  await page.getByLabel('Password').fill(config.github.password);

  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.locator('[name="app_otp"]').fill(TOTP.generate(config.github.totpKey).otp);

  await page.waitForURL('https://github.com');
  await page.close();
}

export async function deleteKoyebResources(baseUrl?: string) {
  const token = config.account.token;

  const listAppIds = async () => {
    const { apps } = await api.listApps({ baseUrl, token, query: { limit: '100' } });
    return apps!.map((app) => app.id!);
  };

  for (const appId of await listAppIds()) {
    await api.deleteApp({ baseUrl, token, path: { id: appId } });
  }

  while ((await listAppIds()).length > 0) {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function catchNewPage(context: BrowserContext, fn: () => Promise<void>) {
  const promise = context.waitForEvent('page');

  await fn();

  return promise;
}

export async function getOrganization(baseUrl?: string): Promise<Organization | undefined> {
  return api.getCurrentOrganization({ baseUrl, token: config.account.token }).then(
    ({ organization }) => mapOrganization(organization!),
    (error) => {
      if (ApiError.is(error, 404)) {
        return undefined;
      }

      throw error;
    },
  );
}
