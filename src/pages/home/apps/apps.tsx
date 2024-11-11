import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Spinner, Select } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useServicesSummary } from 'src/api/hooks/summary';
import { mapAppsDetails } from 'src/api/mappers/apps_details';
import { AppDetails, ServicesSummary, ServiceType } from 'src/api/model';
import { useToken } from 'src/application/token';
import { QueryError } from 'src/components/query-error';
import { useMount } from 'src/hooks/lifecycle';
import { Translate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { useInfiniteScroll } from 'src/utils/pagination';

import { AppItem } from './app-item';

const T = Translate.prefix('pages.home');

const pageSize = 100;

export function Apps({ showFilters = false }: { showFilters?: boolean }) {
  const [serviceType, setServiceType] = useState<ServiceType | 'all'>('all');
  const { token } = useToken();
  const queryClient = useQueryClient();

  const servicesSummary = useServicesSummary();

  const query = useInfiniteQuery({
    queryKey: ['listAppsDetails', { token }],
    async queryFn({ pageParam }) {
      return api
        .listAppsDetails({
          token,
          query: {
            offset: String(pageParam * pageSize),
            limit: String(pageSize),
            order: 'desc',
            service_limit: 10,
          },
        })
        .then(mapAppsDetails);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: AppDetails[], pages, lastPageParam) => {
      if (lastPage.length === pageSize) {
        return lastPageParam + 1;
      }

      return null;
    },
  });

  const setInfiniteScrollElementRef = useInfiniteScroll(query);

  useMount(() => {
    return () => queryClient.removeQueries({ queryKey: ['listAppsDetails'] });
  });

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  return (
    // https://css-tricks.com/flexbox-truncated-text/
    <>
      <div className="col min-w-0 flex-1 gap-6">
        <Header
          showFilters={showFilters}
          servicesSummary={servicesSummary}
          serviceType={serviceType}
          setServiceType={setServiceType}
        />

        {query.data?.pages.flat().map((app) => {
          return <AppItem key={app.id} app={app} services={app.services || []} />;
        })}
      </div>

      <div ref={setInfiniteScrollElementRef} className="row justify-center py-4">
        {query.isFetchingNextPage && <Spinner className="size-4" />}
      </div>
    </>
  );
}

type HeaderProps = {
  showFilters: boolean;
  servicesSummary?: ServicesSummary;
  serviceType: ServiceType | 'all';
  setServiceType: (type: ServiceType | 'all') => void;
};

function Header({ showFilters, servicesSummary, serviceType, setServiceType }: HeaderProps) {
  const webServices = servicesSummary!.byType!.web ?? 0;
  const workerServices = servicesSummary!.byType!.worker ?? 0;
  const databaseServices = servicesSummary!.byType!.database ?? 0;

  return (
    <header className="col sm:row gap-2 sm:items-center sm:gap-4">
      <span className="text-lg font-medium">
        <T id="services" />
      </span>

      <span className="text-dim">
        <T
          id="servicesSummary"
          values={{
            web: webServices,
            worker: workerServices,
            database: databaseServices,
          }}
        />
      </span>

      {showFilters && (
        <Select<ServiceType | 'all'>
          items={['all', 'web', 'worker', 'database']}
          selectedItem={serviceType}
          onSelectedItemChange={setServiceType}
          getKey={identity}
          itemToString={identity}
          renderItem={(type) => <T id={`serviceType.${type}`} />}
          className="w-full max-w-64 sm:ml-auto"
        />
      )}
    </header>
  );
}
