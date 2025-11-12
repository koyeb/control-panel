import clsx from 'clsx';

import { IconCheck } from 'src/icons';
import { arrayToggle } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';
import { Extend } from 'src/utils/types';

import { MultiSelectMenu, Select, SelectedCountBadge, multiSelectStateReducer } from '../forms';

type StatusSelectorProps<Status extends string> = Extend<
  Omit<React.ComponentProps<typeof Select<Status>>, 'items'>,
  {
    statuses: Status[];
    value?: Status[];
    onChange?: (statuses: Status[]) => void;
    renderItem: (status: Status) => React.ReactNode;
    Dot: (props: { status: Status; className?: string }) => React.ReactNode;
    menuClassName?: string;
  }
>;

export function StatusesSelector<Status extends string>({
  label,
  statuses,
  value = [],
  onChange,
  renderItem,
  Dot,
  menuClassName,
  ...props
}: StatusSelectorProps<Status>) {
  return (
    <Select
      items={statuses}
      onChange={(status) => onChange?.(arrayToggle(value, status))}
      select={{ stateReducer: multiSelectStateReducer }}
      dropdown={{ floating: { placement: 'bottom-end' }, matchReferenceSize: false }}
      value={null}
      renderValue={() => (
        <div className="row items-center gap-2">
          <StatusDots statuses={statuses} value={value} Dot={Dot} />
          {label}
          <SelectedCountBadge selected={value.length} total={statuses.length} />
        </div>
      )}
      menu={(context) => (
        <MultiSelectMenu
          context={context}
          items={statuses}
          selected={value}
          getKey={identity}
          onClearAll={() => onChange?.([])}
          onSelectAll={() => onChange?.(statuses)}
          renderItem={(status, selected) => (
            <div className="row w-full items-center gap-2 px-3 py-1.5">
              <Dot status={status} className="size-2" />

              <div className="grow">{renderItem(status)}</div>

              {selected && (
                <div>
                  <IconCheck className="size-4 text-green" />
                </div>
              )}
            </div>
          )}
          className={menuClassName}
        />
      )}
      {...props}
    />
  );
}

type StatusDotsProps<Status extends string> = {
  statuses: Status[];
  value: Status[];
  Dot: React.ComponentType<{ status: Status; className?: string }>;
};

function StatusDots<Status extends string>({ statuses, value, Dot }: StatusDotsProps<Status>) {
  return (
    <div className="flex flex-row-reverse">
      {statuses
        .slice()
        .reverse()
        .map((status) => (
          <Dot
            key={status}
            status={status}
            className={clsx(
              '-ml-0.75 size-2.5 animate-none! border border-neutral',
              !value.includes(status) && 'bg-muted!',
            )}
          />
        ))}
    </div>
  );
}
