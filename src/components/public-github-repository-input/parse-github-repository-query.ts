export function parseGithubRepositoryQuery(value: string): string | undefined {
  const matchResult = /^(?:(?:https?:\/\/)?github.com\/|git@github.com:)?([^/]+)\/([^/]+)/.exec(value);
  const [, org, repo] = matchResult ?? [];

  if (!org || !repo) {
    return;
  }

  return `${org}/${repo.replace(/\.git$/, '')}`;
}
