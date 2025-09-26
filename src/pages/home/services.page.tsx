import { useAppsFull } from 'src/api/hooks/app';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceCreation } from 'src/modules/service-creation/service-creation';

import { Apps } from './apps/apps';

export function ServicesPage() {
  const query = useAppsFull();

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  if (query.data.length === 0) {
    return <ServiceCreation from="/services" />;
  }

  return <Apps apps={query.data} showFilters />;
}
