import { useAppsQuery } from 'src/api/hooks/app';
import { useServicesQuery } from 'src/api/hooks/service';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceCreation } from 'src/modules/service-creation/service-creation';

import { Apps } from './apps/apps';

export function ServicesPage() {
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

  return <Apps showFilters />;
}
