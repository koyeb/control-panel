import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Badge, Button, DialogFooter, Radio, TabButton, TabButtons } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, InstanceCategory } from 'src/api/model';
import { useHasInstanceQuota } from 'src/application/instance-quota';
import { InstanceAvailability } from 'src/application/instance-region-availability';
import { formatBytes } from 'src/application/memory';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useObserve } from 'src/hooks/lifecycle';
import { tallyForms, useTallyDialog, useTallyLink } from 'src/hooks/tally';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, TranslateEnum } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { Dialog, DialogHeader } from './dialog';
import { InstanceAssistant } from './instance-assistant';
import { ExternalLink, ExternalLinkButton } from './link';
import { UpgradeDialog } from './payment-form';

const T = createTranslate('components.instanceSelector');

type InstanceSelectorProps = {
  instances: CatalogInstance[];
  selectedInstance: CatalogInstance | null;
  previousInstance?: CatalogInstance;
  onInstanceSelected: (instance: CatalogInstance | null) => void;
  onCategoryChanged?: (category: InstanceCategory) => void;
  checkAvailability: (instance: string) => InstanceAvailability;
  className?: string;
};

export function InstanceSelector({
  instances,
  selectedInstance,
  previousInstance,
  onInstanceSelected,
  onCategoryChanged,
  checkAvailability,
  className,
}: InstanceSelectorProps) {
  const koyebRegions = instances[0]?.regionCategory === 'koyeb';
  const hasKoyebAI = useFeatureFlag('koyeb-ai');

  const [selectedCategory, setSelectedCategory] = useState<InstanceCategory>(
    selectedInstance?.category ?? 'standard',
  );

  useObserve(selectedInstance, () => {
    if (selectedInstance) {
      setSelectedCategory(selectedInstance.category);
    }
  });

  function onCategorySelected(category: InstanceCategory) {
    setSelectedCategory(category);

    const availableInstancesInCategory = instances
      .filter(hasProperty('category', category))
      .filter((instance) => checkAvailability(instance.identifier)[0]);

    onCategoryChanged?.(category);
    onInstanceSelected(availableInstancesInCategory[0] ?? null);
  }

  return (
    <div className={clsx('col gap-3', className)}>
      {koyebRegions && (
        <TabButtons>
          {(['eco', 'standard', 'gpu'] as const).map((category) => (
            <TabButton
              key={category}
              selected={category === selectedCategory}
              onClick={() => onCategorySelected(category)}
              className="w-full"
            >
              <T id={`tabs.${category}`} />
            </TabButton>
          ))}
        </TabButtons>
      )}

      <div className={clsx('my-4', !koyebRegions && 'font-medium')}>
        <T id={`descriptions.${selectedCategory}`} />
      </div>

      <InstanceSelectorList
        instances={instances.filter(hasProperty('category', selectedCategory))}
        selectedInstance={selectedInstance}
        previousInstance={previousInstance}
        onInstanceSelected={onInstanceSelected}
        checkAvailability={checkAvailability}
      />

      {hasKoyebAI && <InstanceAssistant />}

      <UpgradeDialog
        id="UpgradeInstanceSelector"
        plan="starter"
        title={<T id="upgradeDialog.title" />}
        description={
          <T
            id="upgradeDialog.description"
            values={{ plan: <TranslateEnum enum="plans" value="starter" /> }}
          />
        }
        submit={<T id="upgradeDialog.submitButton" />}
      />
    </div>
  );
}

type InstanceSelectorListProps = {
  instances: readonly CatalogInstance[];
  selectedInstance: CatalogInstance | null;
  previousInstance?: CatalogInstance;
  bestFit?: CatalogInstance;
  minimumVRam?: number;
  onInstanceSelected: (instance: CatalogInstance) => void;
  checkAvailability: (instance: string) => InstanceAvailability;
};

export function InstanceSelectorList({
  instances,
  selectedInstance,
  previousInstance,
  bestFit,
  minimumVRam,
  onInstanceSelected,
  checkAvailability,
}: InstanceSelectorListProps) {
  return (
    <ul className="scrollbar-green scrollbar-thin max-h-80 divide-y overflow-auto rounded-md border">
      {instances.map((instance) => (
        <InstanceItem
          key={instance.identifier}
          instance={instance}
          availability={checkAvailability(instance.identifier)}
          selected={selectedInstance?.identifier === instance.identifier}
          previousInstance={previousInstance}
          onSelected={() => onInstanceSelected(instance)}
          bestFit={bestFit === instance}
          insufficientVRam={
            instance.vram !== undefined && minimumVRam !== undefined && instance.vram < minimumVRam
          }
        />
      ))}
    </ul>
  );
}

type InstanceItemProps = {
  instance: CatalogInstance;
  selected: boolean;
  previousInstance?: CatalogInstance;
  bestFit?: boolean;
  insufficientVRam?: boolean;
  availability: InstanceAvailability;
  onSelected: () => void;
};

function InstanceItem({
  instance,
  selected,
  previousInstance,
  bestFit,
  insufficientVRam,
  availability,
  onSelected,
}: InstanceItemProps) {
  const hasQuotas = useHasInstanceQuota(instance, previousInstance);

  const ref = useRef<HTMLLIElement>(null);
  const [isAvailable] = availability;
  const disabled = !isAvailable;

  useEffect(() => {
    if (selected) {
      ref.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [selected]);

  return (
    <li ref={ref} className="row group/instance-item items-center justify-between">
      <Radio
        name="instance"
        value={instance.identifier}
        label={
          <InstanceDescription
            instance={instance}
            disabled={disabled}
            badge={
              <InstanceBadge
                instance={instance}
                hasQuotas={hasQuotas}
                availability={availability}
                bestFit={bestFit}
                insufficientVRam={insufficientVRam}
              />
            }
          />
        }
        disabled={disabled}
        checked={selected}
        onChange={onSelected}
        className="row w-full items-center gap-3 px-3 py-2"
      />

      {!hasQuotas && <InstanceQuotaButton instance={instance} />}
      <RequestQuotaIncreaseDialog instance={instance} />
    </li>
  );
}

function InstanceQuotaButton({ instance }: { instance: CatalogInstance }) {
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
      return <T id="addCreditCard" />;
    }

    if (isTenstorrentGpu(instance)) {
      return <T id="requestAccess" />;
    }

    return <T id="requestQuotaIncrease" />;
  };

  return (
    <Button
      variant="outline"
      color="gray"
      size={1}
      onClick={handleClick}
      className="invisible mr-4 hidden group-hover/instance-item:visible md:block"
    >
      {text()}
    </Button>
  );
}

export function RequestQuotaIncreaseDialog({ instance }: { instance: CatalogInstance }) {
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <Dialog id={`RequestQuotaIncrease-${instance.identifier}`} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="requestQuotaIncreaseDialog.title" />} />

      <p>
        <T id="requestQuotaIncreaseDialog.line1" values={{ instance: instance?.displayName }} />
      </p>

      <p>
        <T
          id="requestQuotaIncreaseDialog.line2"
          values={{
            link: (children) => (
              <ExternalLink openInNewTab href={tallyLink} className="underline">
                {children}
              </ExternalLink>
            ),
          }}
        />
      </p>

      <DialogFooter>
        <ExternalLinkButton openInNewTab href={tallyLink}>
          <T id="requestQuotaIncreaseDialog.cta" />
        </ExternalLinkButton>
      </DialogFooter>
    </Dialog>
  );
}

const bullet = '•';

type InstanceDescriptionProps = {
  instance: CatalogInstance;
  disabled: boolean;
  badge?: React.ReactNode;
};

function InstanceDescription({ instance, disabled, badge }: InstanceDescriptionProps) {
  return (
    <div className="col gap-1 whitespace-nowrap">
      <div className="col gap-1">
        <span className="row items-center gap-2 font-medium">
          {instance.displayName}
          {badge}
        </span>

        <div className={clsx('row items-center gap-1 text-dim', disabled && 'opacity-50')}>
          {instance.vram && (
            <>
              <span>
                <T id="vram" values={{ value: formatBytes(instance.vram, { decimal: true, round: true }) }} />
              </span>

              <Divider className="h-4" />
            </>
          )}

          <span>
            <T id="cpu" values={{ value: instance.cpu }} />
          </span>

          <Divider className="h-4" />

          <span>
            <T id="ram" values={{ value: instance.ram }} />
          </span>

          <Divider className="h-4" />

          <span>
            <T id="disk" values={{ value: instance.disk }} />
          </span>
        </div>
      </div>

      <div className={clsx('row items-center gap-1', disabled && 'opacity-50')}>
        <InstancePrice instance={instance} />
      </div>
    </div>
  );
}

type InstancePriceProps = {
  instance: CatalogInstance;
};

function InstancePrice({ instance }: InstancePriceProps) {
  if (instance.identifier === 'free') {
    return (
      <>
        <span className="text-green">
          <T id="free" />
        </span>

        <span className="text-dim">{bullet}</span>

        <span className="text-xs text-dim">
          <T id="freeInstanceDescription" />
        </span>
      </>
    );
  }

  if (instance.pricePerMonth === 0) {
    return (
      <span className="text-green">
        <T id="free" />
      </span>
    );
  }

  return (
    <>
      <span className="text-green">
        <T
          id="pricePerHour"
          values={{ price: <FormattedPrice value={instance.pricePerHour} digits={4} /> }}
        />
      </span>

      <span className="text-dim">{bullet}</span>

      <span className="text-xs text-dim">
        <T id="pricePerMonth" values={{ price: <FormattedPrice value={instance.pricePerMonth} /> }} />
      </span>
    </>
  );
}

type DividerProps = {
  className?: string;
};

function Divider({ className }: DividerProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M 12 2 V 20" stroke="currentColor" />
    </svg>
  );
}

type InstanceBadgeProps = {
  instance: CatalogInstance;
  hasQuotas: boolean;
  availability: InstanceAvailability;
  bestFit?: boolean;
  insufficientVRam?: boolean;
};

function InstanceBadge({ instance, hasQuotas, availability, insufficientVRam, bestFit }: InstanceBadgeProps) {
  const organization = useOrganization();
  const [isAvailable, reason] = availability;
  const inUse = !isAvailable && reason === 'freeAlreadyUsed';

  if (inUse) {
    return (
      <Badge size={1} color="green">
        <T id="inUse" />
      </Badge>
    );
  }

  if (instance.status === 'coming_soon') {
    return (
      <Badge size={1} color="blue">
        <T id="comingSoon" />
      </Badge>
    );
  }

  const result = new Array<React.ReactNode>();

  if (instance.category === 'gpu') {
    result.push(
      <Badge key="new" size={1} color="blue">
        <T id="new" />
      </Badge>,
    );
  }

  if (organization.plan !== 'hobby' && !hasQuotas) {
    if (isTenstorrentGpu(instance)) {
      result.push(
        <Badge key="preview" size={1} color="orange">
          <T id="privatePreview" />
        </Badge>,
      );
    } else {
      result.push(
        <Badge key="quotas" size={1} color="orange">
          <T id="requiresHigherQuota" />
        </Badge>,
      );
    }
  }

  if (insufficientVRam) {
    result.push(
      <Badge key="insufficientVRam" size={1} color="orange">
        <T id="insufficientVRam" />
      </Badge>,
    );
  }

  if (bestFit) {
    result.push(
      <Badge key="bestFit" size={1} color="green">
        <T id="bestFit" />
      </Badge>,
    );
  }

  return <>{result}</>;
}

function isTenstorrentGpu(instance: CatalogInstance) {
  return instance.identifier === 'gpu-tenstorrent-n300s' || instance.identifier === '4-gpu-tenstorrent-n300s';
}
