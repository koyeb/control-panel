import { Button, Dropdown, InputStart, Menu, MenuItem, useDropdown } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { useState } from 'react';

import { ApiFn, apiQuery, mapApp, mapService, useApi, useCatalogRegion } from 'src/api';
import { Input } from 'src/components/forms';
import { InputEndSpinner } from 'src/components/forms/helpers/input-end-spinner';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Tooltip } from 'src/components/tooltip';
import { useNavigate } from 'src/hooks/router';
import { IconChevronDown, IconSearch } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, Service, Volume } from 'src/model';
import { hasProperty } from 'src/utils/object';
import { wait } from 'src/utils/promises';

const T = createTranslate('pages.volumes.list.attach');

const limit = 10;

export function AttachVolumeButton({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const regionId = volume.region;
  const region = useCatalogRegion(regionId);

  const [search, setSearch] = useState('');
  const searchQuery = useSearchServicesQuery(regionId, search);

  const servicesCountQuery = useQuery({
    ...apiQuery('get /v1/services', { query: { limit: '1', regions: [regionId] } }),
    refetchInterval: false,
    select: ({ count }) => count,
  });

  const combobox = useCombobox({
    items: searchQuery.data?.services ?? [],

    itemToString: (service) => service?.name ?? '',

    inputValue: search,
    onInputValueChange({ inputValue }) {
      setSearch(inputValue);
    },

    onSelectedItemChange({ selectedItem: service }) {
      if (service) {
        void navigate({ to: `/services/${service.id}/settings`, search: { 'attach-volume': volume.id } });
      }
    },

    stateReducer: (state, { type, changes }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputClick:
          return { ...changes, isOpen: state.isOpen };

        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: state.inputValue };

        default:
          return changes;
      }
    },
  });

  const dropdown = useDropdown({
    floating: {
      open: combobox.isOpen,
      placement: 'bottom-end',
    },
    offset: 4,
    flip: true,
  });

  const { apps, services } = searchQuery.data ?? {};
  const servicesCount = servicesCountQuery.data;

  return (
    <>
      <Tooltip
        forceDesktop
        content={searchQuery.error?.message ?? (volume.serviceId && <T id="alreadyMounted" />)}
        trigger={(props) => (
          <div {...props}>
            <Button
              {...combobox.getToggleButtonProps({ ref: dropdown.refs.setReference })}
              disabled={volume.serviceId !== undefined || searchQuery.isError}
              size={1}
              color="gray"
            >
              <T id="label" />
              <IconChevronDown className="size-em" />
            </Button>
          </div>
        )}
      />

      <Dropdown dropdown={dropdown} onClosed={() => setSearch('')} className="w-full max-w-sm">
        <Input
          {...combobox.getInputProps()}
          type="search"
          start={
            <InputStart background={false}>
              <IconSearch className="size-4 text-dim" />
            </InputStart>
          }
          end={<InputEndSpinner show={searchQuery.isPending} />}
          placeholder={t('placeholder')}
          className={clsx({ hidden: servicesCount === undefined || servicesCount <= limit })}
          root={{ className: 'rounded-b-none border-x-0 border-t-0 outline-none' }}
        />

        {services?.length === 0 && (
          <NoItems message={<T id="noServices" values={{ region: region?.name }} />} />
        )}

        <Menu {...combobox.getMenuProps()} className={clsx({ hidden: services?.length === 0 })}>
          {services?.map((service, index) => (
            <MenuItem
              {...combobox.getItemProps({ item: service, index })}
              key={service.id}
              highlighted={index === combobox.highlightedIndex}
              className="py-1.5"
            >
              <ServiceItem app={apps?.find(hasProperty('id', service.appId))} service={service} />
            </MenuItem>
          ))}
        </Menu>
      </Dropdown>
    </>
  );
}

function useSearchServicesQuery(region: string, search: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['searchServices', { api, region, search }],
    refetchInterval: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      await wait(200, signal);

      const [apps, services] = await Promise.all([
        listApps(api, signal),
        searchServices(api, region, search, signal),
      ]);

      await Promise.all(
        services.map(async (service) => {
          if (!apps.find(hasProperty('id', service.appId))) {
            apps.push(await getApp(api, service.appId, signal));
          }
        }),
      );

      return {
        apps,
        services,
      };
    },
  });
}

async function listApps(api: ApiFn, signal: AbortSignal): Promise<App[]> {
  return api('get /v1/apps', { query: { limit: '100' } }, { signal }).then(({ apps }) => apps!.map(mapApp));
}

async function getApp(api: ApiFn, appId: string, signal: AbortSignal): Promise<App> {
  return api('get /v1/apps/{id}', { path: { id: appId } }, { signal }).then(({ app }) => mapApp(app!));
}

async function searchServices(
  api: ApiFn,
  region: string,
  search: string,
  signal: AbortSignal,
): Promise<Service[]> {
  return api(
    'get /v1/services',
    { query: { name: search, regions: [region], limit: String(limit), types: ['WEB', 'WORKER'] } },
    { signal },
  ).then(({ services }) => services!.map(mapService));
}

function ServiceItem({ app, service }: { app?: App; service: Service }) {
  return (
    <div className="row items-center gap-2">
      <ServiceTypeIcon type={service.type} />

      <div className="col gap-0.5">
        {`${app?.name}/${service.name}`}

        <div className="text-xs text-dim">
          <TranslateEnum enum="serviceType" value={service.type} />
        </div>
      </div>
    </div>
  );
}
