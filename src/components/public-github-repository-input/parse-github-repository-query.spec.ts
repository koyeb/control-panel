import { describe, expect, it } from 'vitest';

import { parseGithubRepositoryQuery } from './parse-github-repository-query';

describe('parseGithubRepositoryQuery', () => {
  it('repo', () => {
    expect(parseGithubRepositoryQuery('repo')).toBeUndefined();
  });

  it('org/repo', () => {
    expect(parseGithubRepositoryQuery('org/repo')).toEqual('org/repo');
  });

  it('github.com/org/repo', () => {
    expect(parseGithubRepositoryQuery('github.com/org/repo')).toEqual('org/repo');
  });

  it('http://github.com/org/repo', () => {
    expect(parseGithubRepositoryQuery('http://github.com/org/repo')).toEqual('org/repo');
  });

  it('https://github.com/org/repo', () => {
    expect(parseGithubRepositoryQuery('https://github.com/org/repo')).toEqual('org/repo');
  });

  it('https://github.com/org/repo/', () => {
    expect(parseGithubRepositoryQuery('https://github.com/org/repo/')).toEqual('org/repo');
  });

  it('https://github.com/org/repo.git', () => {
    expect(parseGithubRepositoryQuery('https://github.com/org/repo.git')).toEqual('org/repo');
  });

  it('https://github.com/org/repo/pulls', () => {
    expect(parseGithubRepositoryQuery('https://github.com/org/repo/pulls')).toEqual('org/repo');
  });

  it('git@github.com:org/repo', () => {
    expect(parseGithubRepositoryQuery('git@github.com:org/repo')).toEqual('org/repo');
  });

  it('git@github.com:org/repo.git', () => {
    expect(parseGithubRepositoryQuery('git@github.com:org/repo.git')).toEqual('org/repo');
  });
});
