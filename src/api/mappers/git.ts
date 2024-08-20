import { ApiEndpointResult } from '../api';
import { GitRepository, GithubApp } from '../model';

export function mapGithubApp(installation: ApiEndpointResult<'getGithubApp'>): GithubApp {
  return {
    installationId: installation.installation_id!,
    installationUrl: installation.installation_url!,
    organizationName: installation.name!,
    indexing:
      installation.indexing_status === 'NOT_STARTED' || installation.indexing_status === 'IN_PROGRESS',
    indexingPercent:
      (installation.indexed_repositories ?? 0) / (installation.total_repositories ?? 1) || null,
  };
}

export function mapRepositoriesList({
  repositories,
}: ApiEndpointResult<'listRepositories'>): GitRepository[] {
  return repositories!.map((repository) => ({
    id: repository.id!,
    name: repository.name!,
    url: repository.url!,
    isPrivate: repository.is_private!,
    defaultBranch: repository.default_branch!,
    lastPush: repository.last_push_date!,
    branches: [],
  }));
}

export function mapRepositoryBranchesList({ branches }: ApiEndpointResult<'listRepositoryBranches'>) {
  return branches!.map((branch) => branch.name!);
}
