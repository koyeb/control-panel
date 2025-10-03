import { Collapse } from '@koyeb/design-system';

import { UpgradeDialog } from 'src/components/payment-form';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { CatalogInstance } from 'src/model';

import { InstanceItem } from './instance-item';
import { type InstanceSelector } from './instance-selector-state';
import { RegionScopeTabs, RegionSelector } from './region-selector';

export type InstanceSelectorBadge =
  | 'inUse'
  | 'new'
  | 'comingSoon'
  | 'preview'
  | 'bestFit'
  | 'insufficientVRam'
  | 'requiresHigherQuota';

const T = createTranslate('components.instanceSelector');

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
    <>
      {instances.map((instance) => (
        <InstanceItem
          key={instance.id}
          instance={instance}
          badges={getBadges(instance)}
          selected={instance.id === selectedInstance?.id}
          onSelected={() => onInstanceSelected(instance)}
          regionSelector={
            <Collapse open={instance.id === selectedInstance?.id} className="@container">
              <div className="mt-4 mb-3 col items-start justify-between gap-2 sm:row sm:items-center">
                <div className="text-dim">
                  <T id="regions.label" />
                </div>

                <RegionScopeTabs scope={regionScope} onScopeChanged={onRegionScopeSelected} />
              </div>

              <RegionSelector
                regions={regions}
                selected={selectedRegions}
                onSelected={onRegionSelected}
                instance={instance}
                type={selectedInstance?.id === 'free' ? 'radio' : 'checkbox'}
                showAvailability
                showLatency
              />
            </Collapse>
          }
        />
      ))}

      <UpgradeDialog
        id="UpgradeInstanceSelector"
        plan="starter"
        title={<T id="actions.upgradeDialog.title" />}
        description={
          <T
            id="actions.upgradeDialog.description"
            values={{ plan: <TranslateEnum enum="plans" value="starter" /> }}
          />
        }
        submit={<T id="actions.upgradeDialog.submitButton" />}
      />
    </>
  );
}
