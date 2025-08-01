import { useQuery } from '@tanstack/react-query';

import { mapApp } from '../mappers/service';
import { useApiQueryFn } from '../use-api';

export function useAppsQuery() {
  return useQuery({
    ...useApiQueryFn('listApps', { query: { limit: '100' } }),
    select: ({ apps }) => apps!.map(mapApp),
  });
}

export function useApps() {
  return useAppsQuery().data;
}

export function useAppQuery(appId?: string) {
  return useQuery({
    ...useApiQueryFn('getApp', { path: { id: appId! } }),
    enabled: appId !== undefined,
    select: ({ app }) => mapApp(app!),
  });
}

export function useApp(appId?: string) {
  return useAppQuery(appId).data;
}
