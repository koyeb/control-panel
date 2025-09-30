import { GitRepository, GithubApp } from 'src/model';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import type { API } from '../api-types';

export function mapGithubApp(installation: API.GetGithubInstallationReply): GithubApp {
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

export function mapRepository(repository: API.Repository): GitRepository {
  return {
    ...snakeToCamelDeep(requiredDeep(repository)),
    branches: [],
  };
}
