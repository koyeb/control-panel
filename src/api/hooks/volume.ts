import { useQuery } from '@tanstack/react-query';

import { mapVolume } from '../mappers/volume';
import { useApiQueryFn } from '../use-api';

export function useVolumesQuery(region?: string) {
  return useQuery({
    ...useApiQueryFn('listVolumes', { query: { limit: '100', region } }),
    select: ({ volumes }) => volumes!.map(mapVolume),
  });
}

export function useVolumes(region?: string) {
  return useVolumesQuery(region).data;
}
