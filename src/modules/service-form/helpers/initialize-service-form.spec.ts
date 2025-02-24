import { QueryClient } from '@tanstack/react-query';
import { MockedFunction, MockedObject, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from 'src/api/api';
import { CatalogRegion, CatalogInstance, Organization, OrganizationSummary, GithubApp } from 'src/api/model';
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

  it('initializes a default service form', async () => {
    expect(await initialize()).toEqual(serviceForm);
  });

  it('initialization with an eco instance', async () => {
    const params = new URLSearchParams({
      instance_type: 'eco-nano',
    });

    const instances = [create.instance({ identifier: 'eco-nano', category: 'eco' })];

    expect(await initialize({ params, instances })).toEqual({
      ...serviceForm,
      instance: 'eco-nano',
      scaling: {
        ...serviceForm.scaling,
        min: 1,
      },
    });
  });

  it('handles organization repository not found', async () => {
    const params = new URLSearchParams({
      type: 'git',
      repository: 'org/repo',
    });

    const githubApp = create.githubApp({ organizationName: 'org' });

    mockApi.listRepositories.mockResolvedValue({ repositories: [] });

    expect(await initialize({ params, githubApp })).toEqual(serviceForm);
  });

  it('handles public repository not found', async () => {
    const params = new URLSearchParams({
      type: 'git',
      repository: 'org/repo',
    });

    mockFetchGithubRepository.mockRejectedValue(new Error());

    serviceForm.source.git.repositoryType = 'public';

    expect(await initialize({ params })).toEqual(serviceForm);
  });
});
