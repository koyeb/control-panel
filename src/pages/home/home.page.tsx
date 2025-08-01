import { useAppsFull } from 'src/api/hooks/app';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { createTranslate } from 'src/intl/translate';
import { ServiceCreation } from 'src/modules/service-creation/service-creation';

import { Activities } from './activities/activities';
import { Apps } from './apps/apps';
import { News } from './news/news';

const T = createTranslate('pages.home');

export function HomePage() {
  const query = useAppsFull();

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  if (query.data.length === 0) {
    return <ServiceCreation />;
  }

  return (
    <>
      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="row-span-2 min-w-0">
          <Apps apps={query.data} />
        </div>

        <News />
        <Activities />
      </div>
    </>
  );
}
