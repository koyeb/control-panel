import { expect, Page, test } from '@playwright/test';

import { describe } from 'node:test';
import { authenticate } from './test-utils';

describe('service form', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto('/services/deploy');
  });

  function section(page: Page, section: string) {
    return page.getByText(section, { exact: true });
  }

  function expandedSection(page: Page) {
    return page.locator('section[data-expanded=true]');
  }

  describe('scaling', () => {
    test('alert when the free instance is selected', async ({ page }) => {
      await section(page, 'Scaling').click();
      await expect(page.getByRole('alert')).toContainText(
        'Services with the Free instance type cannot be scaled',
      );
    });

    test('alert when an eco instance is selected', async ({ page }) => {
      await section(page, 'Instance').click();
      await page.getByText('eNano').click();

      await section(page, 'Scaling').click();
      await expect(expandedSection(page).getByRole('alert')).toContainText(
        'Services with the eNano instance type cannot be scaled automatically',
      );
    });

    test('set min and max on blur', async ({ page }) => {
      await section(page, 'Instance').click();
      await page.getByText('CPU Standard').click();
      await page.getByText('Nano', { exact: true }).click();

      await section(page, 'Scaling').click();

      const max = page.getByLabel('Max');
      const min = page.getByLabel('Min');

      await max.fill('50');
      await max.blur();
      expect(max).toHaveValue('20');

      await min.fill('5');
      await max.fill('2');
      await max.blur();
      expect(max).toHaveValue('5');

      await min.fill('7');
      await min.blur();
      expect(min).toHaveValue('5');
    });

    test('enable and disable targets when min and max change', async ({ page }) => {
      await section(page, 'Instance').click();
      await page.getByText('CPU Standard').click();
      await page.getByText('Nano', { exact: true }).click();

      await section(page, 'Scaling').click();

      const max = page.getByLabel('Max');
      const min = page.getByLabel('Min');

      const requestsPerSecond = page.getByLabel('Target number of requests per second');
      const cpuUsage = page.getByLabel('Target CPU usage');
      const memoryUsage = page.getByLabel('Target memory usage');

      await max.fill('5');
      await expect(requestsPerSecond).toBeEnabled();
      await expect(requestsPerSecond).toBeChecked();
      await expect(cpuUsage).toBeEnabled();
      await expect(cpuUsage).not.toBeChecked();
      await expect(memoryUsage).toBeEnabled();
      await expect(memoryUsage).not.toBeChecked();

      await min.fill('5');
      await expect(requestsPerSecond).toBeDisabled();
      await expect(requestsPerSecond).not.toBeChecked();
      await expect(cpuUsage).toBeDisabled();
      await expect(cpuUsage).not.toBeChecked();
      await expect(memoryUsage).toBeDisabled();
      await expect(memoryUsage).not.toBeChecked();

      // bug: react-hook-form does not trigger a change event when calling setValue
      await min.fill('6');
      await min.blur();
      await expect(requestsPerSecond).toBeDisabled();
      await expect(requestsPerSecond).toBeChecked();
    });
  });
});
