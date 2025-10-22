import { useForm } from 'react-hook-form';

import { useAppsFull } from 'src/api';
import { QueryGuard } from 'src/components/query-error';
import { useDebouncedValue } from 'src/hooks/timers';
import { createTranslate } from 'src/intl/translate';
import { AppList, Service } from 'src/model';
import { entries, hasProperty } from 'src/utils/object';
import { upperCase } from 'src/utils/strings';

import { Apps } from '../home/apps/apps';
import { ServiceCreation } from '../service-creation/service-creation';

import { ServicesFilters, ServicesFiltersForm } from './services-filters';

const T = createTranslate('pages.services');

function getFormFiltersList<K extends string>(values: Record<K, boolean>): Array<Uppercase<K>> {
  return entries(values)
    .filter(([, status]) => status)
    .map(([key]) => key)
    .map((type) => upperCase(type));
}

export function AppsServicesList() {
  const filtersForm = useForm<ServicesFiltersForm>({
    defaultValues: {
      search: '',
      types: {
        web: true,
        worker: true,
        database: true,
      },
      statuses: {
        STARTING: true,
        RESUMING: true,
        HEALTHY: true,
        DEGRADED: true,
        UNHEALTHY: true,
        PAUSED: true,
        DELETED: true,
      },
    },
  });

  const name = useDebouncedValue(filtersForm.watch('search') || undefined, 200);
  const types = getFormFiltersList(filtersForm.watch('types'));
  const statuses = getFormFiltersList(filtersForm.watch('statuses'));

  if (statuses.includes('PAUSED')) {
    statuses.push('PAUSING');
  }

  if (statuses.includes('DELETED')) {
    statuses.push('DELETING');
  }

  const query = useAppsFull({
    name,
    types,
    statuses,
  });

  if (!filtersForm.formState.isDirty && query.data?.apps.length === 0) {
    return <ServiceCreation from="/services" />;
  }

  return (
    <QueryGuard query={query}>
      {(data) => (
        <div className="col gap-8">
          <Title services={Array.from(data.services.values()).flat()} />
          <ServicesFilters form={filtersForm} />
          <AppsList apps={data} resetFilters={() => filtersForm.reset()} />
        </div>
      )}
    </QueryGuard>
  );
}

function AppsList({ apps, resetFilters }: { apps: AppList; resetFilters: () => void }) {
  if (Array.from(apps.services.values()).flat().length === 0) {
    return <NoResults resetFilters={resetFilters} />;
  }

  return <Apps apps={apps} />;
}

function NoResults({ resetFilters }: { resetFilters: () => void }) {
  return (
    <div className="col min-h-64 items-center justify-center gap-4 rounded border p-3">
      <div className="col gap-2 text-center">
        <div className="text-base font-medium">
          <T id="noResults.title" />
        </div>
        <div className="text-dim">
          <T id="noResults.description" />
        </div>
      </div>

      <button type="button" className="font-medium text-green" onClick={resetFilters}>
        <T id="noResults.removeFilters" />
      </button>
    </div>
  );
}

function Title({ services }: { services: Service[] }) {
  const web = services.filter(hasProperty('type', 'web')).length;
  const workers = services.filter(hasProperty('type', 'worker')).length;
  const databases = services.filter(hasProperty('type', 'database')).length;

  return (
    <div className="row items-center gap-4">
      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="text-dim">
        <T id="servicesCount" values={{ web, workers, databases }} />
      </div>
    </div>
  );
}
