import { Button, Combobox, InputBox, Spinner } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { getApi, mapApp, mapService } from 'src/api';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Tooltip } from 'src/components/tooltip';
import { useNavigate } from 'src/hooks/router';
import { IconChevronDown, IconSearch } from 'src/icons';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, Service, Volume } from 'src/model';
import { unique } from 'src/utils/arrays';
import { getId } from 'src/utils/object';
import { wait } from 'src/utils/promises';

const T = createTranslate('pages.volumes.list.attach');

export function AttachVolumeButton({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const searchQuery = useSearchServicesQuery(search);

  const combobox = Combobox.useCombobox({
    placement: 'bottom-end',
    offset: 4,
    flip: true,
    items: searchQuery.data?.services ?? [],
    combobox: {
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
          case Combobox.stateChangeTypes.InputClick:
            return { ...changes, isOpen: state.isOpen };

          case Combobox.stateChangeTypes.ItemClick:
          case Combobox.stateChangeTypes.InputKeyDownEnter:
            return { ...changes, inputValue: state.inputValue };

          default:
            return changes;
        }
      },
    },
  });

  const { apps, services, total } = searchQuery.data ?? {};
  const Icon = searchQuery.isFetching ? Spinner : IconSearch;

  return (
    <Combobox.Provider value={combobox}>
      <Tooltip
        mobile={false}
        content={searchQuery.error?.message ?? (volume.serviceId && <T id="alreadyMounted" />)}
        trigger={(props) => (
          <div {...props}>
            <Button
              {...combobox.getToggleButtonProps({ ref: combobox.floating.refs.setReference })}
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

      <Combobox.Dropdown onTransitionCancel={() => setSearch('')} className="w-full max-w-sm">
        <InputBox
          {...combobox.getInputProps()}
          type="search"
          start={<Icon className="ml-3 size-4 text-dim" />}
          placeholder={t('placeholder')}
          boxClassName={clsx('items-center rounded-b-none border-x-0 border-t-0 outline-none', {
            hidden: total !== undefined && total <= 10,
          })}
        />

        {services?.length === 0 && (
          <div className="col min-h-24 items-center justify-center text-dim">
            <T id="noServices" />
          </div>
        )}

        <Combobox.Menu>
          {services?.map((service) => (
            <Combobox.MenuItem key={service.id} item={service} className="py-1.5">
              <ServiceItem app={apps?.[service.appId]} service={service} />
            </Combobox.MenuItem>
          ))}
        </Combobox.Menu>
      </Combobox.Dropdown>
    </Combobox.Provider>
  );
}

function useSearchServicesQuery(search: string) {
  return useQuery({
    queryKey: ['searchServices', { search }],
    refetchInterval: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      await wait(200, signal);

      const [total, matchingApps, matchingServices] = await Promise.all([
        getTotalServices(signal),
        searchApps(search, signal),
        searchServices(search, signal),
      ]);

      const apps = new Map(matchingApps.map((app) => [app.id, app]));

      const appsServices = await getAppsServices(matchingApps);
      const services = unique([...matchingServices, ...appsServices], getId).slice(0, 10);

      const missingAppIds = matchingServices
        .map((service) => service.appId)
        .filter((appId) => !apps.has(appId));

      for (const app of await getApps(missingAppIds)) {
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

async function getTotalServices(signal: AbortSignal): Promise<number> {
  const api = getApi();

  return api('get /v1/services', { query: { limit: '1' } }, { signal }).then(({ count }) => count!);
}

async function searchApps(search: string, signal: AbortSignal): Promise<App[]> {
  const api = getApi();

  return api('get /v1/apps', { query: { name: search, limit: '10' } }, { signal }).then(({ apps }) =>
    apps!.map(mapApp),
  );
}

async function searchServices(search: string, signal: AbortSignal): Promise<Service[]> {
  const api = getApi();

  return api(
    'get /v1/services',
    { query: { name: search, limit: '10', types: ['WEB', 'WORKER'] } },
    { signal },
  ).then(({ services }) => services!.map(mapService));
}

async function getApps(appIds: string[]): Promise<App[]> {
  const api = getApi();

  return Promise.all(
    appIds.map((appId) => api('get /v1/apps/{id}', { path: { id: appId } }).then(({ app }) => mapApp(app!))),
  );
}

async function getAppsServices(apps: App[]): Promise<Service[]> {
  const api = getApi();

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
        <Translate
          id="common.appServiceName"
          values={{ appName: app?.name ?? '', serviceName: service.name }}
        />

        <div className="text-xs text-dim">
          <TranslateEnum enum="serviceType" value={service.type} />
        </div>
      </div>
    </div>
  );
}
