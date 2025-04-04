import clsx from 'clsx';

import { SelectBox, Tooltip } from '@koyeb/design-system';
import { CatalogInstance, CatalogRegion } from 'src/api/model';
import { useRegionAvailability } from 'src/application/instance-region-availability';
import { ExternalLink } from 'src/components/link';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { tallyForms, useTallyLink } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.serviceCreation.instanceRegions');

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
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <div className="flex-1 lg:mt-16">
      <RegionsList
        selectedInstance={selectedInstance}
        regions={regions.filter(hasProperty('status', 'available'))}
        selectedRegions={selectedRegions}
        onRegionSelected={onRegionSelected}
      />

      <Tooltip content={<T id="awsRegions.tooltip" />}>
        {(props) => (
          <ExternalLink {...props} openInNewTab href={tallyLink} className="mt-8 inline-block underline">
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
        <li key={region.id}>
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
  const [isAvailable] = useRegionAvailability(region.id, {
    instance: selectedInstance ?? undefined,
  });

  return (
    <SelectBox
      type="checkbox"
      disabled={!isAvailable}
      icon={<RegionFlag regionId={region.id} className="size-5" />}
      title={region.name}
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
