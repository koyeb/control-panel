import clsx from 'clsx';

import { SelectBox } from '@koyeb/design-system';
import { CatalogInstance, CatalogRegion } from 'src/api/model';
import {
  useRegionAvailability,
  useRegionAvailabilityForInstance,
} from 'src/application/instance-region-availability';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { RegionsMap } from 'src/components/regions-map/regions-map';

type RegionsSelectorProps = {
  regions: CatalogRegion[];
  selectedInstance: CatalogInstance | null;
  selectedRegions: CatalogRegion[];
  onRegionSelected: (region: CatalogRegion) => void;
};

export function RegionsSelector({
  regions,
  selectedInstance,
  selectedRegions,
  onRegionSelected,
}: RegionsSelectorProps) {
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
            selected={selectedRegions.includes(region)}
            onSelected={onRegionSelected}
          />
        )}
      />
    </div>
  );
}

type RegionsListProps = {
  regions: CatalogRegion[];
  selectedInstance: CatalogInstance | null;
  selectedRegions: CatalogRegion[];
  onRegionSelected: (region: CatalogRegion) => void;
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
            selected={selectedRegions.includes(region)}
            onSelected={() => onRegionSelected(region)}
          />
        </li>
      ))}
    </ul>
  );
}

type RegionItemProps = {
  selectedInstance: CatalogInstance | null;
  region: CatalogRegion;
  selected: boolean;
  onSelected: (region: CatalogRegion) => void;
};

function RegionItem({ selectedInstance, region, selected, onSelected }: RegionItemProps) {
  const [isAvailable] = useRegionAvailability(region.identifier);
  const isAvailableForInstance = useRegionAvailabilityForInstance(
    region.identifier,
    selectedInstance?.identifier,
  );

  return (
    <SelectBox
      type="checkbox"
      disabled={!isAvailable || !isAvailableForInstance}
      icon={<RegionFlag identifier={region.identifier} className="size-5" />}
      title={region.displayName}
      description={<RegionLatency region={region} />}
      checked={selected}
      onChange={() => onSelected(region)}
      classes={{
        content: 'col gap-1 p-2',
        title: '!p-0',
        description: 'whitespace-nowrap !p-0',
      }}
    />
  );
}
