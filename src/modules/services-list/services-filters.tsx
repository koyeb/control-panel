import { InputStart } from '@koyeb/design-system';
import { Controller, UseFormReturn, useController } from 'react-hook-form';

import { ControlledInput } from 'src/components/forms/input';
import {
  MultiSelectMenu,
  Select,
  SelectedCountBadge,
  multiSelectStateReducer,
} from 'src/components/forms/select';
import { ServiceStatusesSelector } from 'src/components/selectors/service-status-selector';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { IconCheck, IconSearch } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { ServiceStatus, ServiceType } from 'src/model';
import { arrayToggle } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';
import { lowerCase } from 'src/utils/strings';

const T = createTranslate('pages.services');

export type ServicesFiltersForm = {
  search: string;
  types: Array<Uppercase<ServiceType>>;
  statuses: Array<ServiceStatus>;
};

export function ServicesFilters({ form }: { form: UseFormReturn<ServicesFiltersForm> }) {
  return (
    <div className="row items-center gap-2">
      <SearchInput form={form} />
      <TypesSelector form={form} />

      <Controller
        control={form.control}
        name="statuses"
        render={({ field }) => <ServiceStatusesSelector label={<T id="filters.status.label" />} {...field} />}
      />
    </div>
  );
}

function SearchInput({ form }: { form: UseFormReturn<ServicesFiltersForm> }) {
  const t = T.useTranslate();

  return (
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
  );
}

const types: Array<Uppercase<ServiceType>> = ['WEB', 'WORKER', 'DATABASE'];

function TypesSelector({ form }: { form: UseFormReturn<ServicesFiltersForm> }) {
  const { field } = useController({
    control: form.control,
    name: 'types',
  });

  return (
    <Select
      {...field}
      items={types}
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
              <ServiceTypeIcon size={1} type={lowerCase(type)} />

              <div className="grow">
                <TranslateEnum enum="serviceType" value={lowerCase(type)} />
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
