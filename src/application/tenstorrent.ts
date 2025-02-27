import { CatalogInstance } from 'src/api/model';

export function isTenstorrentGpu(instance: CatalogInstance) {
  return instance.identifier === 'gpu-tenstorrent-n300s' || instance.identifier === '4-gpu-tenstorrent-n300s';
}
