import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { apiQuery, mapService } from 'src/api';
import { usePagination } from 'src/components/pagination';
import { QueryGuard } from 'src/components/query-error';
import { useDebouncedValue } from 'src/hooks/timers';
import { SandboxesFiltersForm, SandboxesList } from 'src/modules/sandbox/list/sandboxes-list';

export const Route = createFileRoute('/_main/sandboxes/')({
  component: SandboxesListRoute,
});

function SandboxesListRoute() {
  const filtersForm = useForm<SandboxesFiltersForm>({
    defaultValues: {
      search: '',
      statuses: ['STARTING', 'RESUMING', 'HEALTHY', 'DEGRADED', 'UNHEALTHY', 'PAUSED', 'DELETED'],
    },
  });

  const search = useDebouncedValue(filtersForm.watch('search'), 200);
  const statuses = filtersForm.watch('statuses').slice();

  if (statuses.includes('PAUSED')) {
    statuses.push('PAUSING');
  }

  if (statuses.includes('DELETED')) {
    statuses.push('DELETING');
  }

  const pagination = usePagination(100);

  const query = useQuery({
    ...apiQuery('get /v1/services', {
      query: {
        ...pagination.query,
        types: ['SANDBOX'],
        name: search || undefined,
        statuses,
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ services, has_next }) => ({
      services: services!.map(mapService),
      hasNext: Boolean(has_next),
    }),
  });

  const hasSandboxes = useQuery({
    ...apiQuery('get /v1/services', { query: { types: ['SANDBOX'] } }),
    select: ({ count }) => count! > 0,
  });

  pagination.useSync(query.data);

  return (
    <QueryGuard query={query}>
      {({ services }) => (
        <SandboxesList
          hasSandboxes={Boolean(hasSandboxes.data)}
          services={services}
          pagination={pagination}
          filtersForm={filtersForm}
        />
      )}
    </QueryGuard>
  );
}
