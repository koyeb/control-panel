import { BrowserContext, Page, expect, test } from '@playwright/test';

import { authenticate, authenticateOnGithub, catchNewPage, wait } from './test-utils';

async function cleanup(context: BrowserContext) {
  const page = await context.newPage();

  await page.goto('https://github.com/settings/installations');
  page.on('dialog', (dialog) => dialog.accept());

  const configure = page.getByRole('link', { name: 'Configure' });

  while (await configure.isVisible()) {
    await configure.click();
    await page.getByRole('button', { name: 'Uninstall' }).click();

    // give github some time to finish uninstalling the app
    await wait(2000);
    await page.reload();
  }

  await page.close();
}

test.beforeEach(async ({ page, context }) => {
  await authenticate(page);
  await authenticateOnGithub(context);
});

test.beforeEach(({ page, baseURL }) => rewriteGithubCallbackOrigin(page, baseURL));

test.beforeEach(({ context }) => cleanup(context));
test.afterEach(({ context }) => cleanup(context));

test('install github app', async ({ context, page }) => {
  await page.goto('/services/new?service_type=web&step=importProject&type=git');
  await expect(page.getByText('Public GitHub repository')).toBeVisible();

  const editAppPermissions = page.getByRole('link', { name: 'Edit GitHub app permissions' });

  if (await editAppPermissions.isVisible()) {
    const page = await catchNewPage(context, async () => {
      await editAppPermissions.click();
    });

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Uninstall' }).click();
    await page.close();
  }

  await page.getByRole('button', { name: 'Install GitHub app' }).click();
  await page.getByRole('button', { name: 'Install & Authorize' }).click();

  await expect(page).toHaveURL('/services/new?service_type=web&step=importProject&type=git');
  await expect(page.getByRole('button', { name: 'koyeb-e2e/add-numbers' })).toBeVisible();
});

function rewriteGithubCallbackOrigin(page: Page, baseUrl?: string) {
  if (baseUrl?.endsWith('.koyeb.com')) {
    return;
  }

  page.on('domcontentloaded', () => {
    const url = new URL(page.url());
    const target = url.href.replace(url.origin, '');

    if (url.origin.endsWith('.koyeb.com')) {
      page.goto(new URL(target, baseUrl).toString());
    }
  });
}
