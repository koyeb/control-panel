import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import { getApiQueryKey } from './query';

describe('api project scope', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('adds the current project id to every API request', async () => {
    window.localStorage.setItem('currentProjectId', 'project-123');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await api('get /v1/account/profile', {});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(new Headers(init.headers).get('x-koyeb-project-id')).toBe('project-123');
  });

  it('uses an explicit project scope without serializing it', async () => {
    window.localStorage.setItem('currentProjectId', 'stale-project');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await api('post /v1/apps', {
      projectId: 'project-123',
      body: { name: 'app' },
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.searchParams.size).toBe(0);
    expect(new Headers(init.headers).get('x-koyeb-project-id')).toBe('project-123');
    expect(init.body).toBe(JSON.stringify({ name: 'app' }));
  });

  it('keeps the project scope in the query cache key', () => {
    const firstKey = getApiQueryKey('get /v1/apps', { projectId: 'project-123' });
    const secondKey = getApiQueryKey('get /v1/apps', { projectId: 'project-456' });

    expect(firstKey).not.toEqual(secondKey);
  });
});
