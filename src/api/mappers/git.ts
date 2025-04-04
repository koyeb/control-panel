import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import { ApiEndpointResult } from '../api';
import { GitRepository, GithubApp } from '../model';

export function mapGithubApp(installation: ApiEndpointResult<'getGithubApp'>): GithubApp {
  const { indexing_status, indexed_repositories, total_repositories } = installation;

  const indexing = indexing_status === 'NOT_STARTED' || indexing_status === 'IN_PROGRESS';
  const indexingPercent = (indexed_repositories ?? 0) / (total_repositories ?? 1) || null;

  return {
    ...snakeToCamelDeep(requiredDeep(installation)),
    organizationName: installation.name!,
    indexing,
    indexingPercent,
  };
}

export function mapRepositoriesList({
  repositories,
}: ApiEndpointResult<'listRepositories'>): GitRepository[] {
  return repositories!.map((repository) => ({
    ...snakeToCamelDeep(requiredDeep(repository)),
    branches: [],
  }));
}

export function mapRepositoryBranchesList({ branches }: ApiEndpointResult<'listRepositoryBranches'>) {
  return branches!.map((branch) => branch.name!);
}
