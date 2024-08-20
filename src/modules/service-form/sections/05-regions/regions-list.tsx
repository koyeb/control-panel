import sortBy from 'lodash-es/sortBy';

import { useRegions } from 'src/api/hooks/catalog';
import { useRegionAvailabilities } from 'src/application/instance-region-availability';

import { RegionItem } from './region-item';

export function RegionsList() {
  const regions = useSortedRegions();

  return (
    <div className="gaps grid grid-cols-1 md:grid-cols-2">
      {regions.map((region) => (
        <RegionItem key={region.identifier} region={region} />
      ))}
    </div>
  );
}

function useSortedRegions() {
  const regions = useRegions();
  const availabilities = useRegionAvailabilities();

  return sortBy(regions, (region) => (availabilities[region.identifier]?.[0] ? -1 : 1));
}
