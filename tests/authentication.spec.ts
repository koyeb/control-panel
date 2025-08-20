import test, { Page, expect } from '@playwright/test';

import { authenticate, authenticateOnGithub, config } from './test-utils';

async function signIn(page: Page) {
  await page.getByPlaceholder('Email').fill(config.account.email);
  await page.getByPlaceholder('Password').fill(config.account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('log in', async ({ page }) => {
  await page.goto('/auth/signin');

  await signIn(page);
  await expect(page).toHaveURL((url) => url.pathname === '/');
});

test('log out', async ({ page }) => {
  await authenticate(page);
  await page.reload();

  await page.getByRole('menuitem', { name: 'koyeb e2e' }).last().hover();
  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL('/auth/signin');
});

test('redirection after authenticated', async ({ page }) => {
  await page.goto('/services/deploy?name=my-service');
  await expect(page).toHaveURL('/auth/signin?next=%2Fservices%2Fdeploy%3Fname%3Dmy-service');

  await signIn(page);
  await expect(page).toHaveURL('/services/deploy?name=my-service');
});

test('redirection when authenticated', async ({ page }) => {
  await authenticate(page);

  await page.goto('/auth/signin');
  await expect(page).toHaveURL((url) => url.pathname === '/');

  await page.goto('/auth/signin?next=%2Fservices%2Fdeploy%3Fname%3Dmy-service');
  await expect(page).toHaveURL('/services/deploy?name=my-service');
});

test('github sign in', async ({ context, page }) => {
  await authenticateOnGithub(context);
  await page.goto('/auth/signin');

  await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
  await expect(page).toHaveURL((url) => url.pathname === '/');
});

test('switch organization', async ({ page }) => {
  await authenticate(page);
  await page.reload();

  const switcher = page.getByRole('button', { name: 'koyeb-e2e' });

  await switcher.click();
  await page.getByRole('option', { name: 'koyeb-e2e-2' }).click();

  await expect(switcher).toHaveAccessibleName('koyeb-e2e-2');
});
