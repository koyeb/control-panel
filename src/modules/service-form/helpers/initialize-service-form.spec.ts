import { QueryClient } from '@tanstack/react-query';
import { MockedFunction, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  API,
  createApiApp,
  createApiCatalogInstance,
  createApiDeployment,
  createApiDeploymentDefinition,
  createApiOrganization,
  createApiQuotas,
  createApiService,
  createApiVolume,
} from 'src/api';
import { ApiEndpoint, ApiRequestParams } from 'src/api/api';
import { fetchGithubRepository } from 'src/components/public-github-repository-input/github-api';
import { assert } from 'src/utils/assert';

import { ServiceForm, ServiceVolume } from '../service-form.types';

import { defaultServiceForm, initializeServiceForm } from './initialize-service-form';

const mockFetchGithubRepository = fetchGithubRepository as MockedFunction<typeof fetchGithubRepository>;

vi.mock('src/components/public-github-repository-input/github-api', () => ({
  fetchGithubRepository: vi.fn(),
}));

vi.mock('./generate-app-name.ts', () => ({
  generateAppName: () => 'generated',
}));

describe('initializeServiceForm', () => {
  let params: URLSearchParams;
  let queryClient: QueryClient;
  let fetch: MockFetch;

  let datacenters: API.DatacenterListItem[];
  let regions: API.Region[];
  let instances: API.CatalogInstance[];
  let organization: API.Organization;
  let quotas: API.Quotas;

  function mockApi<E extends ApiEndpoint>(endpoint: E, params: ApiRequestParams<E>, response: unknown) {
    const [method, path] = endpoint.split(' ') as [string, string];
    const pathParams = params.path as Record<string, string> | undefined;

    fetch.mock(
      method,
      path.replaceAll(/\{(.*)\}/g, (_, key: string) => pathParams?.[key] ?? ''),
      response,
    );
  }

  beforeEach(() => {
    params = new URLSearchParams();

    instances = [];
    datacenters = [];
    regions = [];

    organization = createApiOrganization();

    quotas = createApiQuotas({
      scale_to_zero: {
        is_light_sleep_enabled: true,
        light_sleep_idle_delay_min: 60,
        light_sleep_idle_delay_max: 3600,
        is_deep_sleep_enabled: true,
        deep_sleep_idle_delay_min: 300,
        deep_sleep_idle_delay_max: 7200,
      },
    });

    queryClient = new QueryClient();
    fetch = new MockFetch();
    window.fetch = fetch.fetch;

    mockApi('get /v1/catalog/instances', {}, { instances });
    mockApi('get /v1/catalog/datacenters', {}, { datacenters });
    mockApi('get /v1/catalog/regions', {}, { regions });
    mockApi('get /v1/account/organization', {}, { organization });
    mockApi(
      'get /v1/organizations/{organization_id}/quotas',
      { path: { organization_id: organization.id! } },
      { quotas },
    );

    instances.push(createApiCatalogInstance({ id: 'free' }));
    instances.push(createApiCatalogInstance({ id: 'nano' }));
    instances.push(createApiCatalogInstance({ id: 'gpu', type: 'gpu' }));
  });

  async function initialize(serviceId?: string) {
    return initializeServiceForm(params, serviceId, undefined, queryClient);
  }

  let serviceForm: ServiceForm;

  beforeEach(() => {
    serviceForm = defaultServiceForm();
    serviceForm.appName = 'generated';
  });

  test('service form initialization', async () => {
    expect(await initialize()).toEqual(serviceForm);
  });

  test('from a hobby organization', async () => {
    organization.plan = 'hobby';

    expect(await initialize()).toEqual({
      ...serviceForm,
      instance: 'free',
      scaling: {
        ...serviceForm.scaling,
        min: 0,
      },
    });
  });

  test('organization repository not found', async () => {
    params.set('type', 'git');
    params.set('repository', 'org/repo');

    mockApi('get /v1/github/installation', {}, { name: 'org' } satisfies API.GetGithubInstallationReply);

    mockApi(
      'get /v1/git/repositories',
      { query: { name: 'org/repo', name_search_op: 'equality' } },
      { repositories: [] },
    );

    expect(await initialize()).toEqual(serviceForm);
  });

  test('public repository not found', async () => {
    params.set('type', 'git');
    params.set('repository', 'org/repo');

    mockFetchGithubRepository.mockRejectedValue(new Error());

    serviceForm.source.git.repositoryType = 'public';

    expect(await initialize()).toEqual(serviceForm);
  });

  test('attach volume', async () => {
    params.set('attach-volume', 'volumeId');

    const volume = createApiVolume({
      id: 'volumeId',
      name: 'volume-name',
      max_size: 1,
    });

    mockApi('get /v1/apps/{id}', { path: { id: 'appId' } }, { app: createApiApp() });

    mockApi(
      'get /v1/services/{id}',
      { path: { id: 'serviceId' } },
      { service: createApiService({ app_id: 'appId', latest_deployment_id: 'deploymentId' }) },
    );

    mockApi(
      'get /v1/deployments/{id}',
      { path: { id: 'deploymentId' } },
      { deployment: createApiDeployment({ definition: createApiDeploymentDefinition() }) },
    );

    mockApi('get /v1/volumes', { query: { limit: '100' } }, { volumes: [volume] });

    const values = await initialize('serviceId');

    expect(values).toHaveProperty('meta.expandedSection', 'volumes');

    expect(values).toHaveProperty<ServiceVolume[]>('volumes', [
      { mounted: false, mountPath: '', name: 'volume-name', size: 1, volumeId: 'volumeId' },
    ]);
  });

  describe('duplicate service', () => {
    let definition: API.DeploymentDefinition;

    beforeEach(() => {
      params.set('duplicate-service-id', 'serviceId');
      definition = createApiDeploymentDefinition();

      mockApi(
        'get /v1/services/{id}',
        { path: { id: 'serviceId' } },
        { service: createApiService({ app_id: 'appId', latest_deployment_id: 'deploymentId' }) },
      );

      mockApi(
        'get /v1/deployments/{id}',
        { path: { id: 'deploymentId' } },
        { deployment: createApiDeployment({ definition }) },
      );
    });

    test('create service based on an existing definition', async () => {
      definition.name = 'test';

      expect(await initialize()).toHaveProperty('serviceName', 'test');
    });

    test('do not keep volumes', async () => {
      definition.volumes = [{ id: 'volumeId', path: '/data' }];

      expect(await initialize()).toHaveProperty('volumes', []);
    });

    test('skip business rules validation', async () => {
      definition.instance_types = [{ type: 'gpu' }];
      definition.scalings = [{ min: 1, max: 1 }];

      expect(await initialize()).toHaveProperty('scaling.min', 1);
    });
  });

  describe('service creation business rules', () => {
    test('app name generation', async () => {
      expect(await initialize()).toHaveProperty('appName', 'generated');
    });

    test('scaling min and max set when instances_min is set', async () => {
      params.set('instances_min', '2');

      const values = await initialize();

      expect(values).toHaveProperty('scaling.min', 2);
      expect(values).toHaveProperty('scaling.max', 2);
    });

    describe('default instance', () => {
      test('hobby plan and instance not set', async () => {
        organization.plan = 'hobby';

        const values = await initialize();

        expect(values).toHaveProperty('instance', 'free');
        expect(values).toHaveProperty('scaling.min', 0);
      });

      test('hobby plan and instance set', async () => {
        organization.plan = 'hobby';
        params.set('instance_type', 'nano');

        const values = await initialize();

        expect(values).toHaveProperty('instance', 'nano');
      });
    });

    describe('scale to zero', () => {
      test('with the free instance', async () => {
        params.set('instance_type', 'free');

        const values = await initialize();

        expect(values).toHaveProperty('scaling.min', 0);
      });

      test('with a GPU', async () => {
        params.set('instance_type', 'gpu');

        const values = await initialize();

        expect(values).toHaveProperty('scaling.min', 0);
      });

      test('with a GPU and type = worker', async () => {
        params.set('service_type', 'worker');
        params.set('instance_type', 'gpu');

        const values = await initialize();

        expect(values).toHaveProperty('scaling.min', 1);
      });

      test('with a GPU and instances_min is set', async () => {
        params.set('instance_type', 'gpu');
        params.set('instances_min', '1');

        const values = await initialize();

        expect(values).toHaveProperty('scaling.min', 1);
      });
    });

    describe('default autoscaling target', () => {
      test('no target enabled when min = max', async () => {
        params.set('instances_min', '2');
        params.set('instances_max', '2');

        const values = await initialize();

        expect(values).toHaveProperty('scaling.targets', serviceForm.scaling.targets);
      });

      test('requests per second when type = web', async () => {
        params.set('instances_max', '2');

        expect(await initialize()).toHaveProperty('scaling.targets.requests.enabled', true);
      });

      test('cpu when type = worker', async () => {
        params.set('instances_max', '2');
        params.set('service_type', 'worker');

        expect(await initialize()).toHaveProperty('scaling.targets.cpu.enabled', true);
      });
    });
  });
});

class MockFetch {
  private mocks = new Map<string, unknown>();

  readonly fetch = vi.fn<typeof globalThis.fetch>((...args) => this.mockImpl(...args));

  mock(method: string, pathname: string, body: unknown) {
    this.mocks.set(`${method.toUpperCase()} ${pathname}`, body);
  }

  private async mockImpl(url: string | URL | globalThis.Request, init?: RequestInit): Promise<Response> {
    assert(url instanceof URL);
    assert(init !== undefined);

    const key = `${init.method} ${url.pathname}`;
    const response = this.mocks.get(key);

    if (!response) {
      throw new Error(`Missing mock for ${key}`);
    }

    return new Response(JSON.stringify(response), {
      headers: new Headers([['Content-Type', 'application/json']]),
    });
  }
}
