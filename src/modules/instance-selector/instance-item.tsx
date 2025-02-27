import clsx from 'clsx';
import { useRef } from 'react';

import { Badge, Button, RadioInput } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance } from 'src/api/model';
import { formatBytes } from 'src/application/memory';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { Dialog } from 'src/components/dialog';
import { IconCpu, IconMemoryStick, IconMicrochip, IconRadioReceiver } from 'src/components/icons';
import { useMount } from 'src/hooks/lifecycle';
import { tallyForms, useTallyDialog } from 'src/hooks/tally';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';

import { InstanceSelectorBadge } from './instance-selector';
import { RequestQuotaIncreaseDialog } from './request-quota-increase-dialog';

const T = createTranslate('components.instanceSelector.new');

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
  const organization = useOrganization();

  const requiresHigherQuota =
    organization.plan === 'hobby'
      ? instance.identifier !== 'free'
      : badges.includes('requiresHigherQuota') || badges.includes('preview');

  const ref = useRef<HTMLLabelElement>(null);

  useMount(() => {
    if (selected) {
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
        <div className="col sm:row gap-4">
          <InstanceDescription
            instance={instance}
            disabled={disabled}
            selected={selected}
            onSelected={onSelected}
            badges={<InstanceBadges badges={badges} />}
          />

          <InstancePrice instance={instance} />
        </div>

        {requiresHigherQuota && <RequestQuota instance={instance} />}
        {!requiresHigherQuota && regionSelector}
      </div>
    </label>
  );
}

const bullet = '•';

function InstancePrice({ instance }: { instance: CatalogInstance }) {
  return (
    <div className="row items-center gap-2 sm:block sm:text-right">
      <div>
        <T
          id="costs.pricePerHour"
          values={{ price: <FormattedPrice value={instance.pricePerHour} digits={6} /> }}
        />
      </div>

      <div className="sm:hidden">{bullet}</div>

      <div className="text-xs text-dim">
        <T id="costs.pricePerMonth" values={{ price: <FormattedPrice value={instance.pricePerMonth} /> }} />
      </div>
    </div>
  );
}

type InstanceDescriptionProps = {
  instance: CatalogInstance;
  disabled?: boolean;
  selected: boolean;
  onSelected: () => void;
  badges: React.ReactNode;
};

export function InstanceDescription({
  instance,
  disabled,
  selected,
  onSelected,
  badges,
}: InstanceDescriptionProps) {
  return (
    <div className="col flex-1 gap-2">
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

      {badges.includes('preview') && (
        <Badge size={1} color="orange">
          <T id="badge.preview" />
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

function RequestQuota({ instance }: { instance: CatalogInstance }) {
  const openDialog = Dialog.useOpen();
  const tally = useTallyDialog(tallyForms.tenstorrentRequest);

  const organization = useOrganization();
  const isHobby = organization.plan === 'hobby';

  const dialog = isHobby ? 'UpgradeInstanceSelector' : `RequestQuotaIncrease-${instance.identifier}`;

  if (instance.identifier === 'free') {
    return null;
  }

  const handleClick = () => {
    if (!isHobby && isTenstorrentGpu(instance)) {
      tally.openPopup();
    } else {
      openDialog(dialog);
    }
  };

  const text = () => {
    if (isHobby) {
      return <T id="actions.addCreditCard" />;
    }

    if (isTenstorrentGpu(instance)) {
      return <T id="actions.requestAccess" />;
    }

    return <T id="actions.requestQuotaIncrease" />;
  };

  return (
    <>
      <Button color="gray" onClick={handleClick} className="mt-4">
        {text()}
      </Button>

      <RequestQuotaIncreaseDialog instance={instance} />
    </>
  );
}
