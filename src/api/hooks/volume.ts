import { useQuery } from '@tanstack/react-query';

import { mapVolume } from '../mappers/volume';
import { apiQuery } from '../query';

export function useVolumesQuery(region?: string) {
  return useQuery({
    ...apiQuery('get /v1/volumes', { query: { limit: '100', region } }),
    select: ({ volumes }) => volumes!.map(mapVolume),
  });
}

export function useVolumes(region?: string) {
  return useVolumesQuery(region).data;
}
