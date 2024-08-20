import { GitRepository } from 'src/api/model';

type GithubRepository = {
  id: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  pushed_at: string;
  visibility: string;
};

export async function fetchGithubRepository(
  repository: string,
  signal?: AbortSignal,
): Promise<GitRepository> {
  const response = await fetch(`https://api.github.com/repos/${repository}`, { signal });

  if (response.status === 404) {
    throw new Error('GithubRepositoryNotFound');
  }

  if (response.status === 403 && response.headers.get('X-Ratelimit-Remaining') === '0') {
    throw new Error('GithubApiQuotaExceeded');
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const body = (await response.json()) as GithubRepository;

  return {
    id: body.id,
    name: body.full_name,
    url: body.html_url,
    isPrivate: body.visibility !== 'public',
    defaultBranch: body.default_branch,
    lastPush: body.pushed_at,
    branches: await fetchBranches(repository),
  };
}

type GithubRepositoryBranch = {
  name: string;
};

async function fetchBranches(repository: string, signal?: AbortSignal): Promise<string[]> {
  const params = new URLSearchParams([['per_page', '100']]);
  const url = `https://api.github.com/repos/${repository}/branches?${params.toString()}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const body = (await response.json()) as GithubRepositoryBranch[];

  return body.map(({ name }) => name);
}
