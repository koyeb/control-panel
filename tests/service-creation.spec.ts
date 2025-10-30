import { expect, test } from '@playwright/test';

import { authenticate, catchNewPage, deleteAllApps } from './test-utils';

test.beforeEach(({ page }) => authenticate(page));
test.beforeEach(deleteAllApps);
test.afterEach(deleteAllApps);

test('github service creation', async ({ context, page }) => {
  test.setTimeout(10 * 60 * 1000);
  await page.goto('/');

  await page.getByRole('button', { name: 'Create service' }).click();
  await page.getByRole('link', { name: 'GitHub' }).click();
  await page.getByPlaceholder('https://github.com/koyeb/example-go').fill('koyeb/example-go-gin');
  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Deploy' }).click();

  await expect(page.getByText('Your service is ready')).toBeVisible({ timeout: 10 * 60 * 1_000 });

  const servicePage = await catchNewPage(context, async () => {
    await page.getByRole('link', { name: 'Visit your service public domain' }).click();
  });

  await expect(async () => {
    await servicePage.reload();
    await expect(servicePage.getByText('Hello, world!')).toBeVisible();
  }).toPass({ timeout: 60 * 1000 });

  await servicePage.close();
});

test('docker service creation', async ({ context, page }) => {
  test.setTimeout(10 * 60 * 1000);
  await page.goto('/');

  await page.getByRole('button', { name: 'Create service' }).click();
  await page.getByRole('link', { name: 'Docker' }).click();
  await page.getByPlaceholder('docker.io/koyeb/demo:latest').fill('koyeb/demo');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Deploy' }).click();

  await expect(page.getByText('Your service is ready')).toBeVisible({ timeout: 10 * 60 * 1_000 });

  const servicePage = await catchNewPage(context, async () => {
    await page.getByRole('link', { name: 'Visit your service public domain' }).click();
  });

  await expect(async () => {
    await servicePage.reload();
    await expect(servicePage.getByText('Welcome to Koyeb')).toBeVisible();
  }).toPass({ timeout: 60 * 1000 });

  await servicePage.close();
});
