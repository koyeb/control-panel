import { Button, Dropdown, InputStart, Menu, MenuItem, useDropdown } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { useState } from 'react';

import { ApiFn, mapApp, mapService, useApi } from 'src/api';
import { Input } from 'src/components/forms';
import { InputEndSpinner } from 'src/components/forms/helpers/input-end-spinner';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Tooltip } from 'src/components/tooltip';
import { useNavigate } from 'src/hooks/router';
import { IconChevronDown, IconSearch } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, Service, Volume } from 'src/model';
import { unique } from 'src/utils/arrays';
import { getId } from 'src/utils/object';
import { wait } from 'src/utils/promises';

const T = createTranslate('pages.volumes.list.attach');

const limit = 3;

export function AttachVolumeButton({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const searchQuery = useSearchServicesQuery(search);

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

  const { apps, services, total } = searchQuery.data ?? {};

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
          className={clsx({ hidden: total !== undefined && total <= limit })}
          root={{ className: 'rounded-b-none border-x-0 border-t-0 outline-none' }}
          inputClassName={clsx('outline-none')}
        />

        {services?.length === 0 && <NoItems message={<T id="noServices" />} />}

        <Menu {...combobox.getMenuProps()} className={clsx({ hidden: services?.length === 0 })}>
          {services?.map((service, index) => (
            <MenuItem
              {...combobox.getItemProps({ item: service, index })}
              key={service.id}
              highlighted={index === combobox.highlightedIndex}
              className="py-1.5"
            >
              <ServiceItem app={apps?.[service.appId]} service={service} />
            </MenuItem>
          ))}
        </Menu>
      </Dropdown>
    </>
  );
}

function useSearchServicesQuery(search: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['searchServices', { api, search }],
    refetchInterval: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      await wait(200, signal);

      const [total, matchingApps, matchingServices] = await Promise.all([
        getTotalServices(api, signal),
        searchApps(api, search, signal),
        searchServices(api, search, signal),
      ]);

      const apps = new Map(matchingApps.map((app) => [app.id, app]));

      const appsServices = await getAppsServices(api, matchingApps);
      const services = unique([...matchingServices, ...appsServices], getId).slice(0, limit);

      const missingAppIds = matchingServices
        .map((service) => service.appId)
        .filter((appId) => !apps.has(appId));

      for (const app of await getApps(api, missingAppIds)) {
        apps.set(app.id, app);
      }

      return {
        total,
        apps: Object.fromEntries(apps.entries()),
        services,
      };
    },
  });
}

async function getTotalServices(api: ApiFn, signal: AbortSignal): Promise<number> {
  return api('get /v1/services', { query: { limit: '1' } }, { signal }).then(({ count }) => count!);
}

async function searchApps(api: ApiFn, search: string, signal: AbortSignal): Promise<App[]> {
  return api('get /v1/apps', { query: { name: search, limit: String(limit) } }, { signal }).then(({ apps }) =>
    apps!.map(mapApp),
  );
}

async function searchServices(api: ApiFn, search: string, signal: AbortSignal): Promise<Service[]> {
  return api(
    'get /v1/services',
    { query: { name: search, limit: String(limit), types: ['WEB', 'WORKER'] } },
    { signal },
  ).then(({ services }) => services!.map(mapService));
}

async function getApps(api: ApiFn, appIds: string[]): Promise<App[]> {
  return Promise.all(
    appIds.map((appId) => api('get /v1/apps/{id}', { path: { id: appId } }).then(({ app }) => mapApp(app!))),
  );
}

async function getAppsServices(api: ApiFn, apps: App[]): Promise<Service[]> {
  const services = await Promise.all(
    apps.map((app) =>
      api('get /v1/services', { query: { app_id: app.id } }).then(({ services }) =>
        services!.map(mapService),
      ),
    ),
  );

  return services.flat().filter((service) => service.type !== 'database');
}

function ServiceItem({ app, service }: { app?: App; service: Service }) {
  return (
    <div className="row items-center gap-2">
      <ServiceTypeIcon type={service.type} />

      <div className="col gap-0.5">
        {app !== undefined && `${app.name}/${service.name}`}

        <div className="text-xs text-dim">
          <TranslateEnum enum="serviceType" value={service.type} />
        </div>
      </div>
    </div>
  );
}
