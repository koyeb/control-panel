import clsx from 'clsx';
import sortBy from 'lodash-es/sortBy';

import { SelectBox } from '@koyeb/design-system';
import { useRegions } from 'src/api/hooks/catalog';
import { CatalogRegion, RegionCategory } from 'src/api/model';
import {
  useRegionAvailabilities,
  useRegionAvailability,
  useRegionAvailabilityForInstance,
} from 'src/application/instance-region-availability';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { RegionsMap } from 'src/components/regions-map/regions-map';
import { hasProperty } from 'src/utils/object';

type RegionsSelectorProps = {
  selectedInstance?: string;
  selectedRegions: string[];
  selectedRegionCategory: RegionCategory;
  onRegionSelected: (region: string) => void;
};

export function RegionsSelector({
  selectedInstance,
  selectedRegions,
  selectedRegionCategory,
  onRegionSelected,
}: RegionsSelectorProps) {
  const availabilities = useRegionAvailabilities();

  const regions = sortBy(useRegions().filter(hasProperty('category', selectedRegionCategory)), (region) =>
    availabilities[region.identifier]?.[0] ? -1 : 1,
  );

  return (
    <div className="flex-1">
      <RegionsList
        className="md:hidden"
        selectedInstance={selectedInstance}
        regions={regions}
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
  regions: CatalogRegion[];
  selectedInstance?: string;
  selectedRegions: string[];
  onRegionSelected: (region: string) => void;
  className?: string;
};

function RegionsList({
  regions,
  selectedInstance,
  selectedRegions,
  onRegionSelected,
  className,
}: RegionsListProps) {
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
      icon={<RegionFlag identifier={region.identifier} className="size-5" />}
      title={region.displayName}
      description={<RegionLatency region={region} />}
      checked={selected}
      onChange={() => onSelected(region.identifier)}
      classes={{
        content: 'col gap-1 p-2',
        title: '!p-0',
        description: 'whitespace-nowrap !p-0',
      }}
    />
  );
}
