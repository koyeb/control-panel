import { Code as BaseCode, CodeLang, InputStart, ProgressBar } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import clsx from 'clsx';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';
import { FormattedNumber } from 'react-intl';

import { apiQuery, mapService, useComputeDeployment } from 'src/api';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ControlledInput } from 'src/components/forms';
import { Pagination, usePagination } from 'src/components/pagination';
import { QueryGuard } from 'src/components/query-error';
import { ServiceStatusesSelector } from 'src/components/selectors/service-status-selector';
import { DeploymentStatusBadge } from 'src/components/status-badges';
import { useFormHasDefaultValues } from 'src/hooks/form';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { useDebouncedValue } from 'src/hooks/timers';
import { IconDocker, IconPlay, IconSearch } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, Service, ServiceStatus } from 'src/model';
import { useDeploymentMetric } from 'src/modules/deployment/deployment-metrics/deployment-metrics';
import { InstanceMetadataValue, RegionsMetadataValue } from 'src/modules/deployment/metadata';

const T = createTranslate('pages.sandbox.list');

export const Route = createFileRoute('/_main/sandboxes/')({
  component: SandboxesListPage,
});

type FiltersForm = {
  search: string;
  statuses: ServiceStatus[];
};

function SandboxesListPage() {
  const filtersForm = useForm<FiltersForm>({
    defaultValues: {
      search: '',
      statuses: ['STARTING', 'RESUMING', 'HEALTHY', 'DEGRADED', 'UNHEALTHY', 'PAUSED', 'DELETED'],
    },
  });

  const searchDebounced = useDebouncedValue(filtersForm.watch('search'), 200);
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
        name: searchDebounced || undefined,
        statuses,
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ services, has_next }) => ({
      services: services!.map(mapService),
      hasNext: Boolean(has_next),
    }),
  });

  pagination.useSync(query.data);

  return (
    <QueryGuard query={query}>
      {({ services }) => (
        <SandboxesList filtersForm={filtersForm} pagination={pagination} services={services} />
      )}
    </QueryGuard>
  );
}

type SandboxesListProps = {
  filtersForm: UseFormReturn<FiltersForm>;
  pagination: Pagination;
  services: Service[];
};

function SandboxesList({ filtersForm, pagination, services }: SandboxesListProps) {
  const hasDefaultValues = useFormHasDefaultValues(filtersForm);
  const noResults = services.length === 0 || filtersForm.watch('statuses').length === 0;

  return (
    <div className="col gap-8">
      <div className="row items-center gap-4">
        <h1 className="typo-heading">
          <T id="title" />
        </h1>

        {services.length > 0 && <div className="text-dim">{services.length}</div>}
      </div>

      {noResults &&
        (hasDefaultValues ? <NoSandboxes /> : <NoResults resetFilters={() => filtersForm.reset()} />)}

      {!noResults && (
        <>
          <Filters form={filtersForm} />

          <div className="col gap-3">
            {services.map((service) => (
              <SandboxItem key={service.id} service={service} />
            ))}
          </div>
        </>
      )}

      {pagination.hasPages && <Pagination pagination={pagination} />}
    </div>
  );
}

const pythonCode = `
import random

arr=[1,2,3,4,5,6]
n=len(arr)-1

for i in range(n):
    random_index = random.randint(0, n)
    temp = arr.pop(random_index)
    arr.append(temp)

print(arr)
`.trim();

export function NoSandboxes() {
  return (
    <div className="col gap-6">
      <p className="text-dim">
        <T id="noSandboxes.intro.sentence" />
      </p>

      <Section number={1} title={<T id="noSandboxes.step1.title" />}>
        <p className="text-dim">
          <T id="noSandboxes.step1.line1" />
        </p>

        <div className="col gap-2">
          <Code lang="shell" value="$ pip install lorem" />

          <p className="text-dim">
            <T id="noSandboxes.step1.line2" />
          </p>
        </div>

        <div className="col gap-2">
          <Code lang="shell" value="$ python -m lorem ipsum" />

          <p className="text-dim">
            <T id="noSandboxes.step1.line3" />
          </p>
        </div>
      </Section>

      <Section number={2} title={<T id="noSandboxes.step2.title" />}>
        <div className="col gap-2">
          <p className="text-dim">
            <T id="noSandboxes.step2.line1" />
          </p>

          <Code lang="python" value={pythonCode} />
        </div>

        <div className="col gap-2">
          <p className="text-dim">
            <T id="noSandboxes.step2.line2" />
          </p>

          <Code lang="shell" value="$ python -m lorem ipsum" />
        </div>

        <div className="col gap-2">
          <p className="text-dim">
            <T id="noSandboxes.step2.line3" />
          </p>

          <Code lang="shell" value="$ python -m lorem ipsum" />
        </div>
      </Section>

      <div className="row items-center gap-3 rounded-md border border-green bg-green/5 p-3 text-base font-medium">
        <div className="flex size-6 items-center justify-center rounded-md border border-green bg-green/5 p-1">
          <IconPlay className="text-green" />
        </div>
        <T id="noSandboxes.end.sentence" />
      </div>
    </div>
  );
}

type SectionProps = {
  number: number;
  title: React.ReactNode;
  children: React.ReactNode;
};

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="rounded-md border">
      <header className="row items-center gap-3 rounded-t-md bg-muted p-3 text-base font-medium">
        <div className="flex size-6 items-center justify-center rounded-md border border-green bg-green/5">
          {number}
        </div>

        {title}
      </header>

      <div className="col gap-4 px-3 py-4">{children}</div>
    </section>
  );
}

function Code({ lang, value }: { lang: CodeLang; value: string }) {
  const theme = useThemeModeOrPreferred();

  return (
    <div className="row items-center rounded-md border bg-muted p-3">
      <BaseCode lang={lang} value={value} theme={theme} className="flex-1" />

      <div className="self-start">
        <CopyIconButton text={value} className="size-8 rounded-md border bg-neutral p-2" />
      </div>
    </div>
  );
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

function Filters({ form }: { form: UseFormReturn<FiltersForm> }) {
  const t = T.useTranslate();

  return (
    <form className="col items-start gap-3 sm:row sm:items-center sm:gap-2">
      <ControlledInput
        control={form.control}
        name="search"
        placeholder={t('search')}
        start={
          <InputStart background={false}>
            <IconSearch className="size-4 text-dim" />
          </InputStart>
        }
      />

      <Controller
        control={form.control}
        name="statuses"
        render={({ field }) => <ServiceStatusesSelector label={<T id="status" />} {...field} />}
      />
    </form>
  );
}

function SandboxItem({ service }: { service: Service }) {
  const deployment = useComputeDeployment(service.latestDeploymentId);

  if (!deployment) {
    return null;
  }

  const { source, instanceType, regions } = deployment.definition;

  return (
    <div
      className={clsx(
        'grid items-center gap-6 rounded-md border p-3',
        'grid-cols-1',
        'lg:grid-cols-[14rem_6rem_4rem_5rem_7rem_7rem_auto]',
        '2xl:grid-cols-[16rem_9rem_9rem_9rem_6rem_6rem_auto]',
      )}
    >
      <div className="row items-center justify-between gap-2 truncate">
        <Link to="/sandboxes/$serviceId" params={{ serviceId: service.id }} className="truncate font-medium">
          {service.name}
        </Link>

        <DeploymentStatusBadge status={deployment.status} />
      </div>

      <div className="truncate text-xs">
        <InstanceMetadataValue instance={instanceType} />
      </div>

      <div className="row items-center gap-2 text-xs">
        <div className="text-dim max-lg:w-14">
          <T id="cpu" />
        </div>

        <MetricValue deployment={deployment} metric="cpu" />
      </div>

      <div className="row items-center gap-2 text-xs">
        <div className="text-dim max-lg:w-14">
          <T id="memory" />
        </div>

        <MetricValue deployment={deployment} metric="memory" />
      </div>

      <div>
        <RegionsMetadataValue regions={regions} />
      </div>

      <div className="row items-center gap-1 text-xs">
        {source.type === 'docker' && (
          <>
            <div>
              <IconDocker className="size-3" />
            </div>
            <div className="truncate">{source.image}</div>
          </>
        )}
      </div>

      <div className="truncate text-xs text-dim lg:text-right">
        <FormattedDistanceToNow value={deployment.date} />
      </div>
    </div>
  );
}

function MetricValue({ deployment, metric }: { deployment: ComputeDeployment; metric: 'cpu' | 'memory' }) {
  const value = useDeploymentMetric(deployment, metric);

  if (value === undefined) {
    return <Translate id="common.noValue" />;
  }

  return (
    <>
      <ProgressBar progress={value} className="max-w-32 flex-1 lg:max-2xl:hidden" />
      <FormattedNumber value={value} style="percent" />
    </>
  );
}
