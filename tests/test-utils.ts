import { BrowserContext, Page } from '@playwright/test';
import { TOTP } from 'totp-generator';

import { ApiEndpoint, api as baseApi } from 'src/api/api';
import { UnexpectedError } from 'src/application/errors';

export const config = {
  baseUrl: process.env.BASE_URL!,
  websiteBaseUrl: process.env.WEBSITE_BASE_URL!,
  account: {
    email: process.env.USER_EMAIL!,
    password: process.env.USER_PASSWORD!,
    token: process.env.USER_TOKEN!,
  },
  github: {
    email: process.env.USER_EMAIL!,
    password: process.env.USER_GITHUB_PASSWORD!,
    totpKey: process.env.USER_GITHUB_TOTP_KEY!,
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

export async function catchNewPage(context: BrowserContext, fn: () => Promise<void>) {
  const promise = context.waitForEvent('page');

  await fn();

  return promise;
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

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.locator('[name="app_otp"]').fill(await oneTimePassword());

  await page.waitForURL('https://github.com');
  await page.close();
}

async function oneTimePassword() {
  const { otp } = await TOTP.generate(config.github.totpKey);
  return otp;
}

export async function api<E extends ApiEndpoint>(
  ...[endpoint, params, options]: Parameters<typeof baseApi<E>>
) {
  const token = config.account.token;
  const baseUrl = config.baseUrl;

  try {
    return await baseApi(endpoint, params, { baseUrl, token, ...options });
  } catch (error) {
    if (error instanceof UnexpectedError && (error.details as { status?: number }).status === 429) {
      await wait(5000);
      return api(endpoint, params, options);
    } else {
      throw error;
    }
  }
}

export async function deleteAllApps() {
  const listAppIds = async () => {
    const { apps } = await api('get /v1/apps', {});
    return apps!.map((app) => app.id!);
  };

  const appIds = await listAppIds();

  await Promise.all(appIds.map((appId) => api('delete /v1/apps/{id}', { path: { id: appId } })));

  while ((await listAppIds()).length > 0) {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
