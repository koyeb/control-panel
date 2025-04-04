import { parseBytes } from 'src/application/memory';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { Api } from '../api-types';
import { Volume, VolumeSnapshot, VolumeSnapshotStatus, VolumeSnapshotType, VolumeStatus } from '../model';

export function mapVolume(volume: Api.PersistentVolume): Volume {
  return {
    ...snakeToCamelDeep(requiredDeep(volume)),
    size: parseBytes(`${volume.max_size}GB`),
    status: lowerCase(volume.status!.replace('PERSISTENT_VOLUME_STATUS_', '')) as VolumeStatus,
  };
}

export function mapSnapshotList(snapshots: Api.Snapshot[]): VolumeSnapshot[] {
  return snapshots.map(mapSnapshot);
}

export function mapSnapshot(snapshot: Api.Snapshot): VolumeSnapshot {
  return {
    ...snakeToCamelDeep(requiredDeep(snapshot)),
    volumeId: snapshot.parent_volume_id!,
    size: parseBytes(`${snapshot.size}GB`),
    status: lowerCase(snapshot.status!.replace('SNAPSHOT_STATUS_', '')) as VolumeSnapshotStatus,
    type: lowerCase(snapshot.type!.replace('SNAPSHOT_TYPE_', '')) as VolumeSnapshotType,
  };
}
