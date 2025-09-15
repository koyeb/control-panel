import { parseBytes } from 'src/application/memory';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { removePrefix } from 'src/utils/strings';

import type { API } from '../api';
import { Volume, VolumeSnapshot } from '../model';

export function mapVolume(volume: API.PersistentVolume): Volume {
  return {
    ...snakeToCamelDeep(requiredDeep(volume)),
    size: parseBytes(`${volume.max_size}GB`),
    status: removePrefix('PERSISTENT_VOLUME_STATUS_', volume.status!),
  };
}

export function mapSnapshot(snapshot: API.Snapshot): VolumeSnapshot {
  return {
    ...snakeToCamelDeep(requiredDeep(snapshot)),
    volumeId: snapshot.parent_volume_id!,
    size: parseBytes(`${snapshot.size}GB`),
    status: removePrefix('SNAPSHOT_STATUS_', snapshot.status!),
    type: removePrefix('SNAPSHOT_TYPE_', snapshot.type!),
  };
}
