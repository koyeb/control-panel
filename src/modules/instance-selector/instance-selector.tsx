import { CatalogInstance } from 'src/api/model';

import { InstanceItem } from './instance-item';
import { type InstanceSelector } from './instance-selector-state';
import { RegionSelector } from './region-selector';

export type InstanceSelectorBadge =
  | 'inUse'
  | 'new'
  | 'comingSoon'
  | 'bestFit'
  | 'insufficientVRam'
  | 'requiresHigherQuota';

type InstanceSelectorProps = InstanceSelector & {
  getBadges: (instance: CatalogInstance) => InstanceSelectorBadge[];
};

export function InstanceSelector({
  regionScope,
  instances,
  regions,
  selectedInstance,
  selectedRegions,
  onRegionScopeSelected,
  onInstanceSelected,
  onRegionSelected,
  getBadges,
}: InstanceSelectorProps) {
  return (
    <div className="col scrollbar-green scrollbar-thin max-h-96 gap-3 overflow-auto pe-2">
      {instances.map((instance) => (
        <InstanceItem
          key={instance.identifier}
          instance={instance}
          badges={getBadges(instance)}
          selected={instance.identifier === selectedInstance?.identifier}
          onSelected={() => onInstanceSelected(instance)}
          regionSelector={
            <RegionSelector
              expanded={instance.identifier === selectedInstance?.identifier}
              regions={regions}
              selected={selectedRegions}
              onSelected={onRegionSelected}
              scope={regionScope}
              onScopeChanged={onRegionScopeSelected}
            />
          }
        />
      ))}
      <div />
    </div>
  );
}
