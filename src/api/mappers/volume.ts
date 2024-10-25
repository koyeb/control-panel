import { parseBytes } from 'src/application/memory';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import { ApiPersistentVolume, ApiSnapshot } from '../api-types';
import { Volume, VolumeSnapshot, VolumeSnapshotStatus, VolumeSnapshotType, VolumeStatus } from '../model';

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

export function mapSnapshotList(snapshots: ApiSnapshot[]): VolumeSnapshot[] {
  return snapshots.map(mapSnapshot);
}

export function mapSnapshot(snapshot: ApiSnapshot): VolumeSnapshot {
  return {
    id: snapshot.id!,
    volumeId: snapshot.parent_volume_id!,
    name: snapshot.name!,
    size: parseBytes(`${snapshot.size}GB`),
    region: snapshot.region!,
    status: lowerCase(snapshot.status!.replace('SNAPSHOT_STATUS_', '')) as VolumeSnapshotStatus,
    type: lowerCase(snapshot.type!.replace('SNAPSHOT_TYPE_', '')) as VolumeSnapshotType,
    createdAt: snapshot.created_at!,
  };
}
