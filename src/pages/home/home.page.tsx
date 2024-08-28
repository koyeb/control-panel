import { useAppsQuery, useServicesQuery } from 'src/api/hooks/service';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { Translate } from 'src/intl/translate';
import { ServiceCreation } from 'src/modules/service-creation/service-creation';

import { Activities } from './activities/activities';
import { Apps } from './apps/apps';
import { News } from './news/news';

const T = Translate.prefix('pages.home');

export function HomePage() {
  const appsQuery = useAppsQuery();
  const servicesQuery = useServicesQuery();

  if (appsQuery.isPending || servicesQuery.isPending) {
    return <Loading />;
  }

  if (appsQuery.isError) {
    return <QueryError error={appsQuery.error} />;
  }

  if (servicesQuery.isError) {
    return <QueryError error={servicesQuery.error} />;
  }

  if (appsQuery.data.length === 0) {
    return <ServiceCreation />;
  }

  return (
    <>
      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr,24rem]">
        <div className="row-span-2 min-w-0">
          <Apps />
        </div>

        <News />
        <Activities />
      </div>
    </>
  );
}
