import { parseBytes } from 'src/application/memory';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import { Volume, VolumeSnapshot, VolumeSnapshotStatus, VolumeSnapshotType, VolumeStatus } from '../model';

export function mapVolumesList({ volumes }: ApiEndpointResult<'listVolumes'>): Volume[] {
  return volumes!.map(mapVolume);
}

export function mapVolume(volume: Api.PersistentVolume): Volume {
  return {
    id: volume.id!,
    name: volume.name!,
    region: volume.region!,
    size: parseBytes(`${volume.max_size}GB`),
    status: lowerCase(volume.status!.replace('PERSISTENT_VOLUME_STATUS_', '')) as VolumeStatus,
    snapshotId: volume.snapshot_id,
    serviceId: volume.service_id,
    createdAt: volume.created_at!,
  };
}

export function mapSnapshotList(snapshots: Api.Snapshot[]): VolumeSnapshot[] {
  return snapshots.map(mapSnapshot);
}

export function mapSnapshot(snapshot: Api.Snapshot): VolumeSnapshot {
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
