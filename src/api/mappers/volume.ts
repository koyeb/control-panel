import { parseBytes } from 'src/application/memory';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import { ApiPersistentVolume } from '../api-types';
import { Volume, VolumeStatus } from '../model';

export function mapVolumesList({ volumes }: ApiEndpointResult<'listVolumes'>): Volume[] {
  return volumes!.map(mapVolume);
}

export function mapVolume(volume: ApiPersistentVolume): Volume {
  return {
    id: volume.id!,
    name: volume.name!,
    region: volume.region!,
    size: parseBytes(`${volume.max_size}GB`),
    status: lowerCase(volume.status!.replace('PERSISTENT_VOLUME_STATUS_', '')) as VolumeStatus,
    serviceId: volume.service_id,
    createdAt: volume.created_at!,
  };
}
