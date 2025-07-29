import { QueryClient } from '@tanstack/react-query';
import { MockedFunction, beforeEach, describe, expect, test, vi } from 'vitest';

import { Api } from 'src/api/api';
import {
  CatalogDatacenter,
  CatalogInstance,
  CatalogRegion,
  GithubApp,
  Organization,
  OrganizationQuotas,
} from 'src/api/model';
import { fetchGithubRepository } from 'src/components/public-github-repository-input/github-api';
import { create } from 'src/utils/factories';

import { ServiceForm } from '../service-form.types';

import { defaultServiceForm, initializeServiceForm } from './initialize-service-form';

const mockFetchGithubRepository = fetchGithubRepository as MockedFunction<typeof fetchGithubRepository>;

vi.mock('src/components/public-github-repository-input/github-api', () => ({
  fetchGithubRepository: vi.fn(),
}));

vi.mock('./generate-app-name.ts', () => ({
  generateAppName: () => 'generated',
}));

describe('initializeServiceForm', () => {
  let api: Api;
  let params: URLSearchParams;
  let datacenters: CatalogDatacenter[];
  let regions: CatalogRegion[];
  let instances: CatalogInstance[];
  let organization: Organization;
  let quotas: OrganizationQuotas;
  let githubApp: GithubApp | undefined;
  let serviceId: string | undefined;

  beforeEach(() => {
    api = {} as Api;

    params = new URLSearchParams();

    datacenters = [];
    regions = [];

    instances = [
      create.instance({ id: 'free' }),
      create.instance({ id: 'nano' }),
      create.instance({ id: 'gpu', category: 'gpu' }),
    ];

    organization = create.organization();
    quotas = create.quotas();

    githubApp = undefined;
    serviceId = undefined;
  });

  async function initialize() {
    return initializeServiceForm(
      api,
      params,
      datacenters,
      regions,
      instances,
      organization,
      quotas,
      githubApp,
      serviceId,
      new QueryClient(),
    );
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

    githubApp = create.githubApp({ organizationName: 'org' });

    api.listRepositories = vi.fn().mockResolvedValue({ repositories: [] });

    expect(await initialize()).toEqual(serviceForm);
  });

  test('public repository not found', async () => {
    params.set('type', 'git');
    params.set('repository', 'org/repo');

    mockFetchGithubRepository.mockRejectedValue(new Error());

    serviceForm.source.git.repositoryType = 'public';

    expect(await initialize()).toEqual(serviceForm);
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
