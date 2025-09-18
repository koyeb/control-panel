import { Navigate } from '@tanstack/react-router';

import { useAppsFull } from 'src/api/hooks/app';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';

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
    return <Navigate to="/services/new" />;
  }

  return <Apps apps={query.data} showFilters />;
}
