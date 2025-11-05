import test, { Page, expect } from '@playwright/test';

import * as API from 'src/api/api.generated';

import { api, assert, authenticate, config, wait } from './test-utils';

test.beforeEach(({ page }) => authenticate(page));

const target = process.env.ONE_CLICK_APP;

if (target && target !== 'all') {
  test(target, async ({ page }) => {
    await deployOneClickApp(page, target);
  });
} else {
  const instances = await listCatalogInstances();
  const apps = await listOneClickApps();

  const gpuApps = apps.filter((app) => {
    const instanceId = app.template_definition.instance_types?.[0]?.type;
    const instance = instances.find((instance) => instance.id === instanceId);

    return instance?.type === 'gpu';
  });

  const nonGpuApps = apps.filter((app) => !gpuApps.includes(app));

  test.describe('non GPU one-click apps', () => {
    test.describe.configure({ mode: 'parallel' });

    for (const app of nonGpuApps) {
      test(app.name, async ({ page }) => {
        await deployOneClickApp(page, app.slug);
      });
    }
  });

  test.describe('GPU one-click apps', () => {
    for (const app of gpuApps) {
      test(app.name, async ({ page }) => {
        await deployOneClickApp(page, app.slug);
      });
    }
  });
}

async function listOneClickApps() {
  const response = await fetch(`${config.websiteBaseUrl}/api/one-click-apps.json`);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.json() as Promise<Array<{ slug: string; name: string; template_definition: any }>>;
}

async function deployOneClickApp(page: Page, slug: string) {
  await page.goto(`/one-clicks/${slug}/deploy`);
  await page.getByRole('button', { name: 'Deploy' }).click();

  await expect(page).toHaveURL((url) => url.pathname.match(/^\/services\/new/) !== null);

  const serviceId = new URL(page.url()).searchParams.get('serviceId');

  assert(serviceId !== null);
  await waitHealthy(serviceId);

  const service = await getService(serviceId);

  await api('delete /v1/apps/{id}', { path: { id: service.app_id! } });
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

function listCatalogInstances() {
  return api('get /v1/catalog/instances', { query: { limit: '100' } }).then(({ instances }) => instances!);
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
