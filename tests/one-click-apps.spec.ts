import test, { Page, expect } from '@playwright/test';

import * as API from 'src/api/api.generated';

import { api, assert, authenticate, config, deleteAllApps, wait } from './test-utils';

const buildTimeout = 5 * 60 * 1000;
const deploymentTimeout = 5 * 60 * 1000;

test.beforeEach(({ page }) => authenticate(page));
test.beforeEach(deleteAllApps);
test.afterEach(deleteAllApps);

const target = process.env.ONE_CLICK_APP;

if (target && target !== 'all') {
  test(target, async ({ page }) => {
    await deployOneClickApp(page, target);
  });
} else {
  for (const app of await listOneClickApps()) {
    test(app.name, async ({ page }) => {
      await deployOneClickApp(page, app.slug);
    });
  }
}

async function listOneClickApps() {
  const response = await fetch(`${config.websiteBaseUrl}/api/one-click-apps.json`);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<Array<{ slug: string; name: string }>>;
}

async function deployOneClickApp(page: Page, slug: string) {
  test.setTimeout(buildTimeout + deploymentTimeout + 60);

  await page.goto(`/one-clicks/${slug}/deploy`);
  await page.getByRole('button', { name: 'Deploy' }).click();

  await expect(page).toHaveURL((url) => url.pathname.match(/^\/services\/new/) !== null);

  const serviceId = new URL(page.url()).searchParams.get('serviceId');

  assert(serviceId !== null);
  await waitHealthy(serviceId);
}

async function waitHealthy(serviceId: string) {
  const service = await getService(serviceId);
  let deployment = await getDeployment(service.latest_deployment_id!);

  while (isPending(deployment)) {
    await wait(5 * 1000);
    deployment = await getDeployment(service.latest_deployment_id!);
  }

  expect(deployment.status).toBe('HEALTHY');
}

function getService(serviceId: string) {
  return api('get /v1/services/{id}', { path: { id: serviceId } }).then(({ service }) => service!);
}

function getDeployment(deploymentId: string) {
  return api('get /v1/deployments/{id}', { path: { id: deploymentId } }).then(
    ({ deployment }) => deployment!,
  );
}

function isPending(deployment: API.components['schemas']['Deployment']) {
  return ['PENDING', 'PROVISIONING', 'SCHEDULED', 'ALLOCATING', 'STARTING', 'STOPPING', 'ERRORING'].includes(
    String(deployment.status),
  );
}
