import { CatalogInstance } from 'src/api/model';

export function isTenstorrentGpu(instance?: CatalogInstance) {
  if (instance === undefined) {
    return false;
  }

  return instance.id === 'gpu-tenstorrent-n300s' || instance.id === '4-gpu-tenstorrent-n300s';
}
