import clsx from 'clsx';
import { useEffect, useRef } from 'react';

import { Badge, Radio, TabButton, TabButtons } from '@koyeb/design-system';
import { CatalogInstance, InstanceCategory } from 'src/api/model';
import { InstanceAvailability } from 'src/application/instance-region-availability';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('instanceSelector');

type InstanceSelectorProps = {
  instances: CatalogInstance[];
  selectedCategory: InstanceCategory;
  onCategorySelected: (category: InstanceCategory) => void;
  selectedInstance: CatalogInstance | null;
  onInstanceSelected: (instance: CatalogInstance) => void;
  checkAvailability: (instance: string) => InstanceAvailability;
  className?: string;
};

export function InstanceSelector({
  instances,
  selectedCategory,
  onCategorySelected,
  selectedInstance,
  onInstanceSelected,
  checkAvailability,
  className,
}: InstanceSelectorProps) {
  const koyebRegions = instances[0]?.regionCategory === 'koyeb';

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
        instances={instances}
        selectedCategory={selectedCategory}
        selectedInstance={selectedInstance}
        onInstanceSelected={onInstanceSelected}
        checkAvailability={checkAvailability}
      />
    </div>
  );
}

type InstanceSelectorListProps = {
  instances: readonly CatalogInstance[];
  selectedCategory?: InstanceCategory;
  selectedInstance: CatalogInstance | null;
  onInstanceSelected: (instance: CatalogInstance) => void;
  checkAvailability: (instance: string) => InstanceAvailability;
};

export function InstanceSelectorList({
  instances,
  selectedCategory,
  selectedInstance,
  onInstanceSelected,
  checkAvailability,
}: InstanceSelectorListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [selectedCategory]);

  return (
    <ul
      ref={listRef}
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className="scrollbar-green scrollbar-thin max-h-[21rem] divide-y overflow-auto rounded-md border"
    >
      {instances.map((instance) => (
        <InstanceItem
          key={instance.identifier}
          instance={instance}
          availability={checkAvailability(instance.identifier)}
          selected={selectedInstance === instance}
          onSelected={() => onInstanceSelected(instance)}
        />
      ))}
    </ul>
  );
}

type InstanceItemProps = {
  instance: CatalogInstance;
  selected: boolean;
  availability: InstanceAvailability;
  onSelected: () => void;
};

function InstanceItem({ instance, selected, availability, onSelected }: InstanceItemProps) {
  const [isAvailable] = availability;
  const disabled = !isAvailable;

  return (
    <li>
      <Radio
        name="instance"
        value={instance.identifier}
        label={
          <InstanceDescription
            instance={instance}
            disabled={disabled}
            badge={<InstanceBadge instance={instance} availability={availability} />}
          />
        }
        disabled={disabled}
        checked={selected}
        onChange={onSelected}
        className="row w-full items-center gap-3 px-3 py-2"
      />
    </li>
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
                <T id="vram" values={{ value: instance.vram }} />
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
  if (instance.pricePerMonth === 0) {
    return (
      <>
        <span className="text-green">
          <T id="free" />
        </span>

        <span className="text-dim">{bullet}</span>

        <span className="text-xs text-dim">
          <T
            id="freeInstanceDescription"
            values={{ price: <FormattedPrice value={instance.pricePerSecond} digits={8} /> }}
          />
        </span>
      </>
    );
  }

  return (
    <>
      <span className="text-green">
        <T
          id="pricePerMonth"
          values={{ price: <FormattedPrice value={instance.pricePerMonth} digits={2} /> }}
        />
      </span>

      <span className="text-dim">{bullet}</span>

      <span className="text-xs text-dim">
        <T
          id="pricePerSecond"
          values={{ price: <FormattedPrice value={instance.pricePerSecond} digits={8} /> }}
        />
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
  availability: InstanceAvailability;
};

function InstanceBadge({ instance, availability }: InstanceBadgeProps) {
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

  if (instance.category === 'gpu') {
    return (
      <Badge size={1} color="blue">
        <T id="new" />
      </Badge>
    );
  }

  return null;
}
