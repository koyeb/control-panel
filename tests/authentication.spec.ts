import test, { expect, Page } from '@playwright/test';
import { TOTP } from 'totp-generator';

import { authenticate, config, pathname } from './test-utils';

async function signIn(page: Page) {
  await page.getByPlaceholder('Email').fill(config.account.email);
  await page.getByPlaceholder('Password').fill(config.account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('log in', async ({ page }) => {
  await page.goto('/auth/signin');
  await signIn(page);
  await expect(page).toHaveURL('/auth/signin');
});

test('log out', async ({ page }) => {
  await authenticate(page);

  await page.getByRole('button', { name: 'koyeb e2e' }).last().click();
  await page.getByRole('button', { name: 'Log Out' }).click();

  await expect.poll(() => pathname(page)).toEqual('/auth/signin');
});

test('redirection after authenticated', async ({ page }) => {
  await page.goto('/domains');
  await expect(page).toHaveURL('/auth/signin?next=%2Fdomains');
  await signIn(page);
  await expect(page).toHaveURL('/domains');
});

test('redirection when authenticated', async ({ page }) => {
  await authenticate(page);
  await page.goto('/auth/signin');
  await expect.poll(() => pathname(page)).toEqual('/');
});

test('github sign in', async ({ context, page }) => {
  const githubPage = await context.newPage();

  await githubPage.goto('https://github.com/login');

  await githubPage.getByLabel('Username or email address').fill(config.github.email);
  await githubPage.getByLabel('Password').fill(config.github.password);

  await githubPage.getByRole('button', { name: 'Sign in' }).click();

  await githubPage.locator('[name="app_otp"]').fill(TOTP.generate(config.github.totpKey).otp);

  await githubPage.waitForURL('https://github.com');
  await githubPage.close();

  await page.goto('/auth/signin');
  await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
  await expect.poll(() => pathname(page)).toEqual('/');
});

test('switch organization', async ({ page }) => {
  await authenticate(page);

  await page.getByTestId('organization-switcher').click();
  await page.getByRole('button', { name: 'koyeb-e2e-2' }).click();

  await expect(page.getByTestId('organization-switcher')).toHaveText(/koyeb-e2e-2/);
});
