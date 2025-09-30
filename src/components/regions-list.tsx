import { useRegionsCatalog } from 'src/api';
import { isDefined } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

import { RegionFlag } from './region-flag';

export function RegionsList({ regionIds }: { regionIds: string[] }) {
  const regions = useRegionsCatalog();

  return (
    <ul className="col gap-2">
      {regionIds
        .map((id) => regions.find(hasProperty('id', id)))
        .filter(isDefined)
        .map((region) => (
          <li key={region.id} className="row items-center gap-2">
            <RegionFlag regionId={region.id} className="size-4" />
            {region.name}
          </li>
        ))}
    </ul>
  );
}
