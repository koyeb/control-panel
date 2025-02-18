import { useEffect, useState } from 'react';

import { CatalogInstance, CatalogRegion, RegionScope } from 'src/api/model';
import { isDefined } from 'src/utils/generic';

import { InstanceItem } from './instance-item';
import { RegionSelector } from './region-selector';

export type InstanceSelectorBadge =
  | 'inUse'
  | 'new'
  | 'comingSoon'
  | 'bestFit'
  | 'insufficientVRam'
  | 'requiresHigherQuota';

type InstanceSelectorProps = {
  instances: CatalogInstance[];
  regions: CatalogRegion[];
  selectedInstance: CatalogInstance | null;
  onInstanceSelected: (instance: CatalogInstance) => void;
  selectedRegions: CatalogRegion[];
  onRegionsSelected: (regions: CatalogRegion[]) => void;
  getBadges: (instance: CatalogInstance) => InstanceSelectorBadge[];
};

export function InstanceSelector({
  instances,
  regions,
  selectedInstance,
  onInstanceSelected,
  selectedRegions,
  onRegionsSelected,
  getBadges,
}: InstanceSelectorProps) {
  const [scope, setScope] = useState<RegionScope>(selectedRegions[0]?.scope ?? 'metropolitan');

  const onScopeChanged = (scope: RegionScope) => {
    setScope(scope);
    onRegionsSelected([regions.find((region) => region.scope === scope)].filter(isDefined));
  };

  useEffect(() => {
    const selected = selectedRegions.filter((region) => regions.includes(region));

    if (selected.length !== selectedRegions.length) {
      onRegionsSelected(selected);
    }
  }, [regions, selectedRegions, onRegionsSelected]);

  return (
    <div className="col scrollbar-green scrollbar-thin max-h-96 gap-3 overflow-auto pe-2">
      {instances.map((instance) => (
        <InstanceItem
          key={instance.identifier}
          instance={instance}
          badges={getBadges(instance)}
          selected={instance === selectedInstance}
          onSelected={() => onInstanceSelected(instance)}
          regionSelector={
            <RegionSelector
              expanded={instance === selectedInstance}
              regions={regions}
              selected={selectedRegions}
              onSelected={onRegionsSelected}
              scope={scope}
              onScopeChanged={onScopeChanged}
            />
          }
        />
      ))}
      <div />
    </div>
  );
}
