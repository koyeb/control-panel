import clsx from 'clsx';

import { SelectBox, Tooltip } from '@koyeb/design-system';
import { CatalogInstance, CatalogRegion } from 'src/api/model';
import {
  useRegionAvailability,
  useRegionAvailabilityForInstance,
} from 'src/application/instance-region-availability';
import { ExternalLink } from 'src/components/link';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { RegionsMap } from 'src/components/regions-map/regions-map';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('serviceCreation.instanceRegions');

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
    <div>
      <RegionsList
        className="2xl:hidden"
        selectedInstance={selectedInstance}
        regions={regions}
        selectedRegions={selectedRegions}
        onRegionSelected={onRegionSelected}
      />

      <RegionsMap
        className="hidden 2xl:block"
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

      <Tooltip content={<T id="awsRegions.tooltip" />}>
        {(props) => (
          <ExternalLink
            {...props}
            openInNewTab
            href="https://app.reclaim.ai/m/koyeb-intro/short-call"
            className="mt-8 inline-block underline"
          >
            <T id="awsRegions.title" />
          </ExternalLink>
        )}
      </Tooltip>
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
