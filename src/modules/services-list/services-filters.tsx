import { InputStart } from '@koyeb/design-system';
import clsx from 'clsx';
import { UseFormReturn, useController } from 'react-hook-form';

import { ControlledInput } from 'src/components/forms/input';
import {
  MultiSelectMenu,
  Select,
  SelectedCountBadge,
  multiSelectStateReducer,
} from 'src/components/forms/select';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { ServiceStatusDot } from 'src/components/status-dot';
import { IconCheck, IconSearch } from 'src/icons';
import { TranslateEnum, createTranslate, translateStatus } from 'src/intl/translate';
import { ServiceStatus, ServiceType } from 'src/model';
import { arrayToggle } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';
import { upperCase } from 'src/utils/strings';

const T = createTranslate('pages.services');

export type ServicesFiltersForm = {
  search: string;
  types: ServiceType[];
  statuses: ServiceStatus[];
};

const types: ServiceType[] = ['web', 'worker', 'database'];

const statuses: ServiceStatus[] = [
  'STARTING',
  'RESUMING',
  'HEALTHY',
  'DEGRADED',
  'UNHEALTHY',
  'PAUSED',
  'DELETED',
];

export function ServicesFilters({ form }: { form: UseFormReturn<ServicesFiltersForm> }) {
  const t = T.useTranslate();

  return (
    <div className="row items-center gap-2">
      <ControlledInput
        control={form.control}
        name="search"
        type="search"
        placeholder={t('filters.search.placeholder')}
        start={
          <InputStart background={false}>
            <IconSearch className="size-4 text-dim" />
          </InputStart>
        }
        className="w-full"
      />

      <TypesSelector form={form} />

      <StatusesSelector form={form} />
    </div>
  );
}

function TypesSelector({ form }: { form: UseFormReturn<ServicesFiltersForm> }) {
  const { field } = useController({
    control: form.control,
    name: 'types',
  });

  return (
    <Select
      {...field}
      items={types}
      field={() => ({ className: 'min-w-32' })}
      select={{ stateReducer: multiSelectStateReducer }}
      dropdown={{ floating: { placement: 'bottom-end' }, matchReferenceSize: false }}
      value={null}
      onChange={(type) => field.onChange(arrayToggle(field.value, type))}
      renderValue={() => (
        <div className="row items-center gap-2">
          <T id="filters.type.label" />
          <SelectedCountBadge selected={field.value.length} total={types.length} />
        </div>
      )}
      menu={(context) => (
        <MultiSelectMenu
          context={context}
          items={types}
          selected={field.value}
          getKey={identity}
          onClearAll={() => field.onChange([])}
          onSelectAll={() => field.onChange(types)}
          renderItem={(type, selected) => (
            <div className="row items-center justify-between gap-2 px-3 py-1.5">
              <ServiceTypeIcon size={1} type={type} />

              <div className="grow">
                <TranslateEnum enum="serviceType" value={type} />
              </div>

              {selected && <IconCheck className="size-4 text-green" />}
            </div>
          )}
          className="min-w-56"
        />
      )}
    />
  );
}

function StatusesSelector({ form }: { form: UseFormReturn<ServicesFiltersForm> }) {
  const { field } = useController({
    control: form.control,
    name: 'statuses',
  });

  const label = (status: ServiceStatus) => {
    if (status === 'PAUSED') {
      return [translateStatus('PAUSING'), translateStatus('PAUSED')].join(' / ');
    }

    if (status === 'DELETED') {
      return [translateStatus('DELETING'), translateStatus('DELETED')].join(' / ');
    }

    return translateStatus(status);
  };

  return (
    <Select
      {...field}
      items={statuses}
      field={() => ({ className: 'min-w-48' })}
      select={{ stateReducer: multiSelectStateReducer }}
      dropdown={{ floating: { placement: 'bottom-end' }, matchReferenceSize: false }}
      value={null}
      onChange={(status) => field.onChange(arrayToggle(field.value, status))}
      renderValue={() => (
        <div className="row items-center gap-2">
          <StatusDots statuses={field.value} />
          <T id="filters.status.label" />
          <SelectedCountBadge selected={field.value.length} total={statuses.length} />
        </div>
      )}
      menu={(context) => (
        <MultiSelectMenu
          context={context}
          items={statuses}
          selected={field.value}
          getKey={identity}
          onClearAll={() => field.onChange([])}
          onSelectAll={() => field.onChange(statuses)}
          renderItem={(status, selected) => (
            <div className="row w-full items-center gap-2 px-3 py-1.5">
              <ServiceStatusDot status={upperCase(status)} className="size-2" />

              <div className="grow">{label(status)}</div>

              {selected && (
                <div>
                  <IconCheck className="size-4 text-green" />
                </div>
              )}
            </div>
          )}
          className="min-w-56"
        />
      )}
    />
  );
}

function StatusDots({ statuses: enabledStatuses }: { statuses: ServicesFiltersForm['statuses'] }) {
  return (
    <div className="flex flex-row-reverse">
      {statuses
        .slice()
        .reverse()
        .map((status) => (
          <ServiceStatusDot
            key={status}
            status={upperCase(status)}
            className={clsx(
              '-ml-0.75 size-2.5 animate-none! border border-neutral',
              !enabledStatuses.includes(status) && 'bg-muted!',
            )}
          />
        ))}
    </div>
  );
}
