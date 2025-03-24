import { QueryClient } from '@tanstack/react-query';
import { MockedFunction, MockedObject, beforeEach, describe, expect, test, vi } from 'vitest';

import { api } from 'src/api/api';
import {
  CatalogDatacenter,
  CatalogInstance,
  CatalogRegion,
  GithubApp,
  Organization,
  OrganizationSummary,
} from 'src/api/model';
import { fetchGithubRepository } from 'src/components/public-github-repository-input/github-api';
import { create } from 'src/utils/factories';

import { ServiceForm } from '../service-form.types';

import { defaultServiceForm, initializeServiceForm } from './initialize-service-form';

const mockFetchGithubRepository = fetchGithubRepository as MockedFunction<typeof fetchGithubRepository>;
const mockApi = api as MockedObject<typeof api>;

vi.mock('src/components/public-github-repository-input/github-api', () => ({
  fetchGithubRepository: vi.fn(),
}));

vi.mock('src/api/api', async (importOriginal) => {
  const actual: object = await importOriginal();

  return {
    ...actual,
    api: {
      listRepositories: vi.fn(),
    },
  };
});

vi.mock('./generate-app-name.ts', () => ({
  generateAppName: () => 'generated',
}));

describe('initializeServiceForm', () => {
  async function initialize(
    options: Partial<{
      params: URLSearchParams;
      datacenters: CatalogDatacenter[];
      regions: CatalogRegion[];
      instances: CatalogInstance[];
      organization: Organization;
      summary: OrganizationSummary;
      githubApp: GithubApp;
      serviceId: string;
    }> = {},
  ) {
    return initializeServiceForm(
      options.params ?? new URLSearchParams(),
      options.datacenters ?? [],
      options.regions ?? [],
      options.instances ?? [],
      options.organization ?? create.organization(),
      options.githubApp,
      options.serviceId,
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
    const organization = create.organization({ plan: 'hobby' });

    expect(await initialize({ organization })).toEqual({
      ...serviceForm,
      instance: 'free',
      scaling: {
        ...serviceForm.scaling,
        min: 0,
      },
    });
  });

  test('with the free instance', async () => {
    const params = new URLSearchParams({
      instance_type: 'free',
    });

    const instances = [create.instance({ id: 'free' })];

    expect(await initialize({ params, instances })).toEqual({
      ...serviceForm,
      instance: 'free',
      scaling: {
        ...serviceForm.scaling,
        min: 0,
      },
    });
  });

  test('with a GPU instance', async () => {
    const params = new URLSearchParams({
      instance_type: 'gpu',
    });

    const instances = [create.instance({ id: 'gpu', category: 'gpu' })];

    expect(await initialize({ params, instances })).toEqual({
      ...serviceForm,
      instance: 'gpu',
      scaling: {
        ...serviceForm.scaling,
        min: 0,
      },
    });
  });

  test('organization repository not found', async () => {
    const params = new URLSearchParams({
      type: 'git',
      repository: 'org/repo',
    });

    const githubApp = create.githubApp({ organizationName: 'org' });

    mockApi.listRepositories.mockResolvedValue({ repositories: [] });

    expect(await initialize({ params, githubApp })).toEqual(serviceForm);
  });

  test('public repository not found', async () => {
    const params = new URLSearchParams({
      type: 'git',
      repository: 'org/repo',
    });

    mockFetchGithubRepository.mockRejectedValue(new Error());

    serviceForm.source.git.repositoryType = 'public';

    expect(await initialize({ params })).toEqual(serviceForm);
  });
});
