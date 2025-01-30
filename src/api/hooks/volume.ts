import { useQuery } from '@tanstack/react-query';

import { fromApi } from '../from-api';
import { useApiQueryFn } from '../use-api';

export function useVolumesQuery(region?: string) {
  return useQuery({
    ...useApiQueryFn('listVolumes', { query: { limit: '100', region } }),
    select: ({ volumes }) => fromApi(volumes!),
  });
}

export function useVolumes(region?: string) {
  return useVolumesQuery(region).data;
}
