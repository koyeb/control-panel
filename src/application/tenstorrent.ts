import { CatalogInstance } from 'src/api/model';

export function isTenstorrentGpu(instance?: CatalogInstance | null) {
  return instance?.id.includes('tenstorrent');
}
