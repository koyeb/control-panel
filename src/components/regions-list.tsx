import { useRegions } from 'src/api/hooks/catalog';
import { isDefined } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

import { RegionFlag } from './region-flag';

export function RegionsList({ identifiers }: { identifiers: string[] }) {
  const regions = useRegions();

  return (
    <ul className="col gap-2">
      {identifiers
        .map((identifier) => regions.find(hasProperty('identifier', identifier)))
        .filter(isDefined)
        .map((region) => (
          <li key={region.identifier} className="row items-center gap-2">
            <RegionFlag identifier={region.identifier} className="size-4" />
            {region.displayName}
          </li>
        ))}
    </ul>
  );
}
