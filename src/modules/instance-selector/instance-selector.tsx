import { CatalogInstance } from 'src/api/model';
import { UpgradeDialog } from 'src/components/payment-form';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

import { InstanceItem } from './instance-item';
import { type InstanceSelector } from './instance-selector-state';
import { RegionSelector } from './region-selector';

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
            <RegionSelector
              expanded={instance.id === selectedInstance?.id}
              regions={regions}
              selected={selectedRegions}
              onSelected={onRegionSelected}
              scope={regionScope}
              onScopeChanged={onRegionScopeSelected}
              type={selectedInstance?.id === 'free' ? 'radio' : 'checkbox'}
            />
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
