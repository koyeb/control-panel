import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Badge, RadioInput } from '@koyeb/design-system';
import { CatalogInstance, CatalogRegion, RegionScope } from 'src/api/model';
import { formatBytes } from 'src/application/memory';
import { useMount } from 'src/hooks/lifecycle';
import { createTranslate } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';

import { IconCpu, IconMemoryStick, IconMicrochip, IconRadioReceiver } from '../icons';

import { RegionSelector } from './region-selector';

const T = createTranslate('components.instanceSelector.new');

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
  const [scope, setScope] = useState<RegionScope>(regions[0]?.scope ?? 'metropolitan');

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
    <div className="col max-h-96 gap-3 overflow-auto pe-2">
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
              regions={regions.filter((region) => region.scope === scope)}
              selected={selectedRegions}
              onSelected={onRegionsSelected}
              scope={scope}
              onScopeChanged={onScopeChanged}
            />
          }
        />
      ))}
    </div>
  );
}

type InstanceItemProps = {
  instance: CatalogInstance;
  badges: InstanceSelectorBadge[];
  disabled?: boolean;
  selected: boolean;
  onSelected: () => void;
  regionSelector: React.ReactNode;
};

export function InstanceItem({
  instance,
  disabled,
  badges,
  selected,
  onSelected,
  regionSelector,
}: InstanceItemProps) {
  const ref = useRef<HTMLLabelElement>(null);

  useMount(() => {
    if (selected) {
      ref.current?.scrollIntoView({ block: 'center' });
    }
  });

  return (
    <label
      ref={ref}
      className={clsx(
        'group/instance cursor-pointer rounded-lg border',
        'transition-colors has-[[data-instance]:checked]:border-green',
      )}
    >
      <div className="rounded-t-lg p-4">
        <InstanceDescription
          instance={instance}
          disabled={disabled}
          selected={selected}
          onSelected={onSelected}
          badges={<InstanceBadges badges={badges} />}
        />

        {regionSelector}
      </div>

      <InstanceFooter instance={instance} />
    </label>
  );
}

type InstanceDescriptionProps = {
  instance: CatalogInstance;
  disabled?: boolean;
  selected: boolean;
  onSelected: () => void;
  badges: React.ReactNode;
};

function InstanceDescription({ instance, disabled, selected, onSelected, badges }: InstanceDescriptionProps) {
  return (
    <div className="col gap-2">
      <div className="row items-center gap-2 font-medium">
        <RadioInput disabled={disabled} checked={selected} onChange={onSelected} data-instance />
        {instance.displayName}
        {badges}
      </div>

      <InstanceSpec instance={instance} />
    </div>
  );
}

function InstanceSpec({ instance }: { instance: CatalogInstance }) {
  return (
    <div className="row gap-3 text-sm">
      <div className="row items-center gap-1">
        <IconCpu className="size-4 stroke-1 text-dim" />
        <T id="instanceSpec.cpu" values={{ value: instance.cpu }} />
      </div>

      {instance.vram && (
        <div className="row items-center gap-1">
          <IconMicrochip className="size-4 stroke-1 text-dim" />
          <T
            id="instanceSpec.vram"
            values={{ value: formatBytes(instance.vram, { round: true, decimal: true }) }}
          />
        </div>
      )}

      <div className="row items-center gap-1">
        <IconMemoryStick className="size-4 stroke-1 text-dim" />
        <T id="instanceSpec.ram" values={{ value: instance.ram }} />
      </div>

      <div className="row items-center gap-1">
        <IconRadioReceiver className="size-4 stroke-1 text-dim" />
        <T id="instanceSpec.disk" values={{ value: instance.ram }} />
      </div>
    </div>
  );
}

function InstanceFooter({ instance }: { instance: CatalogInstance }) {
  return (
    <div
      className={clsx(
        'rounded-b-lg bg-muted px-4 py-1 text-dim',
        'group-has-[[data-instance]:checked]/instance:bg-green group-has-[[data-instance]:checked]/instance:text-white',
      )}
    >
      <T id="costs.price" values={{ perMonth: instance.pricePerMonth, perHour: instance.pricePerHour }} />
    </div>
  );
}

function InstanceBadges({ badges }: { badges: InstanceSelectorBadge[] }) {
  return (
    <>
      {badges.includes('inUse') && (
        <Badge size={1} color="green">
          <T id="badge.inUse" />
        </Badge>
      )}

      {badges.includes('new') && (
        <Badge key="new" size={1} color="blue">
          <T id="badge.new" />
        </Badge>
      )}

      {badges.includes('comingSoon') && (
        <Badge size={1} color="blue">
          <T id="badge.comingSoon" />
        </Badge>
      )}

      {badges.includes('bestFit') && (
        <Badge key="bestFit" size={1} color="green">
          <T id="badge.bestFit" />
        </Badge>
      )}

      {badges.includes('insufficientVRam') && (
        <Badge key="insufficientVRam" size={1} color="orange">
          <T id="badge.insufficientVRam" />
        </Badge>
      )}

      {badges.includes('requiresHigherQuota') && (
        <Badge key="quotas" size={1} color="orange">
          <T id="badge.requiresHigherQuota" />
        </Badge>
      )}
    </>
  );
}
