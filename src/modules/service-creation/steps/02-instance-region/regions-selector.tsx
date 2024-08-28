import clsx from 'clsx';
import sortBy from 'lodash-es/sortBy';
import { useMemo } from 'react';

import { SelectBox } from '@koyeb/design-system';
import { useRegions } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import {
  useRegionAvailability,
  useRegionAvailabilityForInstance,
} from 'src/application/instance-region-availability';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { RegionsMap } from 'src/components/regions-map/regions-map';

type RegionsSelectorProps = {
  selectedInstance?: string;
  selectedRegions: string[];
  onRegionSelected: (region: string) => void;
};

export function RegionsSelector({
  selectedInstance,
  selectedRegions,
  onRegionSelected,
}: RegionsSelectorProps) {
  const regions = useRegions();

  return (
    <div className="flex-1">
      <RegionsList
        className="md:hidden"
        selectedInstance={selectedInstance}
        selectedRegions={selectedRegions}
        onRegionSelected={onRegionSelected}
      />

      <RegionsMap
        className="mt-10 hidden md:block"
        regions={regions}
        renderRegion={(region) => (
          <RegionItem
            selectedInstance={selectedInstance}
            region={region}
            selected={selectedRegions.includes(region.identifier)}
            onSelected={onRegionSelected}
          />
        )}
      />
    </div>
  );
}

type RegionsListProps = {
  selectedInstance?: string;
  selectedRegions: string[];
  onRegionSelected: (region: string) => void;
  className?: string;
};

function RegionsList({ selectedInstance, selectedRegions, onRegionSelected, className }: RegionsListProps) {
  const regions = useSortedRegions();

  return (
    <ul className={clsx('gaps grid grid-cols-1 sm:grid-cols-2', className)}>
      {regions.map((region) => (
        <li key={region.identifier}>
          <RegionItem
            selectedInstance={selectedInstance}
            region={region}
            selected={selectedRegions.includes(region.identifier)}
            onSelected={() => onRegionSelected(region.identifier)}
          />
        </li>
      ))}
    </ul>
  );
}

function useSortedRegions() {
  const regions = useRegions();

  return useMemo(() => {
    return sortBy(regions, ({ status }) => (status === 'available' ? -1 : 1));
  }, [regions]);
}

type RegionItemProps = {
  selectedInstance?: string;
  region: CatalogRegion;
  selected: boolean;
  onSelected: (region: string) => void;
};

function RegionItem({ selectedInstance, region, selected, onSelected }: RegionItemProps) {
  const [isAvailable] = useRegionAvailability(region.identifier);
  const isAvailableForInstance = useRegionAvailabilityForInstance(region.identifier, selectedInstance);

  return (
    <SelectBox
      type="checkbox"
      disabled={!isAvailable || !isAvailableForInstance}
      title={
        <div className="row items-center gap-1">
          <RegionFlag identifier={region.identifier} className="size-5" />
          {region.displayName}
        </div>
      }
      description={
        <div className="whitespace-nowrap">
          <RegionLatency region={region} />
        </div>
      }
      checked={selected}
      onChange={() => onSelected(region.identifier)}
      classes={{
        content: 'col gap-1 p-2',
        title: '!p-0',
        description: '!p-0',
      }}
    />
  );
}
