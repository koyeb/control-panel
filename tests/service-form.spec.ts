import { Page, expect, test } from '@playwright/test';

import { authenticate, getOrganization } from './test-utils';

test.beforeEach(async ({ page }) => {
  await authenticate(page);
  await page.goto('/services/deploy');
});

function section(page: Page, section: string) {
  return page.locator('section').getByText(section, { exact: true });
}

function expandedSection(page: Page) {
  return page.locator('section[data-expanded=true]');
}

async function selectInstance(page: Page, category: string, name: string) {
  await section(page, 'Instance').click();
  await page.getByRole('tab', { name: category }).click();
  await page.getByRole('radio', { name }).locator('..').click();
}

test.describe('scaling', () => {
  test('message when the free instance is selected', async ({ page }) => {
    await selectInstance(page, 'CPU Eco', 'Free');

    await section(page, 'Scaling').click();
    await expect(expandedSection(page)).toContainText(
      'The free instance scales down to zero after periods of inactivity. Select any paid instance type to configure scaling.',
    );
  });

  test('scale to zero message when an eco instance is selected', async ({ page }) => {
    await selectInstance(page, 'CPU Eco', 'eNano');

    await section(page, 'Scaling').click();
    await expect(expandedSection(page)).toContainText(
      'Scale to zero requires a Standard or GPU instance type',
    );
  });

  test('scale to zero message when the organization is on the starter plan', async ({ page, baseURL }) => {
    const organization = await getOrganization(baseURL);

    test.skip(organization?.plan !== 'starter', 'The organization is not on the starter plan');

    await selectInstance(page, 'CPU Standard', 'Nano');

    await section(page, 'Scaling').click();
    await page.getByLabel('Minimum').fill('0');
    await expect(expandedSection(page)).toContainText(
      'Idle period and light to deep sleep transition customization is available starting the Pro plan',
    );
  });

  test('enable and disable targets when min and max change', async ({ page }) => {
    await selectInstance(page, 'CPU Standard', 'Nano');

    await section(page, 'Scaling').click();

    const min = page.getByLabel('Minimum');
    const max = page.getByLabel('Maximum');

    const requestsPerSecond = page.getByLabel('Request per second');
    const cpuUsage = page.getByLabel('CPU usage');
    const memoryUsage = page.getByLabel('Memory usage');

    await max.fill('2');
    await expect(requestsPerSecond).toBeEnabled();
    await expect(requestsPerSecond).toBeChecked();
    await expect(cpuUsage).toBeEnabled();
    await expect(cpuUsage).not.toBeChecked();
    await expect(memoryUsage).toBeEnabled();
    await expect(memoryUsage).not.toBeChecked();

    await min.fill('2');
    await expect(requestsPerSecond).toBeDisabled();
    await expect(requestsPerSecond).not.toBeChecked();
    await expect(cpuUsage).toBeDisabled();
    await expect(cpuUsage).not.toBeChecked();
    await expect(memoryUsage).toBeDisabled();
    await expect(memoryUsage).not.toBeChecked();

    await expect(expandedSection(page)).toContainText(
      'Autoscaling can only be configured if the maximum number of instances is greater than one and the minimum and maximum instance counts are not equal',
    );

    await section(page, 'Service type').click();
    await page.getByRole('radio', { name: 'Worker' }).locator('..').click();

    await section(page, 'Scaling').click();

    await min.fill('1');
    await expect(requestsPerSecond).toBeDisabled();
    await expect(requestsPerSecond).not.toBeChecked();
    await expect(cpuUsage).toBeEnabled();
    await expect(cpuUsage).toBeChecked();
    await expect(memoryUsage).toBeEnabled();
    await expect(memoryUsage).not.toBeChecked();
  });

  test('scaling disabled with volumes', async ({ page }) => {
    await selectInstance(page, 'CPU Standard', 'Nano');

    await section(page, 'Volumes').click();
    await page.getByRole('button', { name: 'Add volume' }).click();

    await section(page, 'Scaling').click();
    await expect(expandedSection(page)).toContainText(
      "Scale to zero can't be enabled when volumes are attached to the service",
    );
    await expect(expandedSection(page)).toContainText(
      "Autoscaling can't be configured when volumes are attached to the service",
    );
  });
});
