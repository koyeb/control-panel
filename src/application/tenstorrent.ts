import { CatalogInstance } from 'src/model';

export function isTenstorrentGpu(instance?: CatalogInstance | null) {
  return instance?.id.includes('tenstorrent');
}
