import { useQuery } from '@tanstack/react-query';

import { mapVolume } from '../mappers/volume';
import { apiQuery } from '../query';

export function useVolumesQuery(region?: string) {
  return useQuery({
    ...apiQuery('get /v1/volumes', { query: { limit: '100', region } }),
    refetchInterval: 5_000,
    select: ({ volumes }) => volumes!.map(mapVolume),
  });
}

export function useVolumes(region?: string) {
  return useVolumesQuery(region).data;
}

export function useVolumeQuery(volumeId: string) {
  return useQuery({
    ...apiQuery('get /v1/volumes/{id}', { path: { id: volumeId } }),
    refetchInterval: 5_000,
    select: ({ volume }) => mapVolume(volume!),
  });
}

export function useVolume(volumeId: string) {
  return useVolumeQuery(volumeId).data;
}
