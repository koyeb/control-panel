import clsx from 'clsx';
import { Duration, format, sub } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';

import { IconButton, Menu, MenuItem, Spinner } from '@koyeb/design-system';
import { useRegions } from 'src/api/hooks/catalog';
import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import {
  App,
  CatalogRegion,
  ComputeDeployment,
  Instance,
  LogLine as LogLineType,
  Service,
} from 'src/api/model';
import { isDeploymentRunning } from 'src/application/service-functions';
import { ControlledCheckbox, ControlledInput, ControlledSelect } from 'src/components/controlled';
import { FullScreen } from 'src/components/full-screen';
import { IconFullscreen } from 'src/components/icons';
import { getInitialLogOptions } from 'src/components/logs/log-options';
import {
  LogLineContent,
  LogLineDate,
  LogLineInstanceId,
  LogLines,
  LogLineStream,
  LogOptions,
  LogsFooter,
} from 'src/components/logs/logs';
import waitingForLogsImage from 'src/components/logs/waiting-for-logs.gif';
import { QueryError } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { SelectInstance } from 'src/components/select-instance';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useFormValues } from 'src/hooks/form';
import { LogsApi } from 'src/hooks/logs';
import { createTranslate } from 'src/intl/translate';
import { inArray, last } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.deploymentLogs.runtime');

type LogsPeriod = 'live' | '1h' | '6h' | '24h' | '7d' | '30d';

export type RuntimeLogsFilters = {
  period: LogsPeriod;
  start: Date;
  end: Date;
  region: string | null;
  instance: string | null;
  search: string;
  logs: boolean;
  events: boolean;
};

type RuntimeLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
  logs: LogsApi;
  filtersForm: UseFormReturn<RuntimeLogsFilters>;
};

export function RuntimeLogs({ app, service, deployment, instances, logs, filtersForm }: RuntimeLogsProps) {
  const regions = useRegions().filter((region) => deployment.definition.regions.includes(region.id));

  const optionsForm = useForm<LogOptions>({
    defaultValues: () => Promise.resolve(getInitialLogOptions()),
  });

  const filters = useFormValues(filtersForm);
  const filteredLines = useFilteredLines(logs.lines, filters, instances);
  const filteredInstances = useFilteredInstances(filters, instances);

  const renderLine = useCallback((line: LogLineType, options: LogOptions) => {
    return <LogLine options={options} line={line} />;
  }, []);

  if (logs.error) {
    return <QueryError error={logs.error} className="m-4" />;
  }

  if (
    logs.lines.length === 0 &&
    inArray(deployment.status, ['pending', 'provisioning', 'scheduled', 'allocating'])
  ) {
    return <WaitingForLogs />;
  }

  return (
    <FullScreen
      enabled={optionsForm.watch('fullScreen')}
      exit={() => optionsForm.setValue('fullScreen', false)}
      className="col gap-2 p-4"
    >
      <LogsHeader
        filters={filtersForm}
        options={optionsForm}
        regions={regions}
        instances={filteredInstances}
      />

      <LogLines
        options={optionsForm.watch()}
        setOption={optionsForm.setValue}
        logs={{ ...logs, lines: filteredLines }}
        renderLine={renderLine}
        renderNoLogs={() => <NoLogs deployment={deployment} loading={logs.loading} filters={filtersForm} />}
      />

      <LogsFooter
        appName={app.name}
        serviceName={service.name}
        lines={logs.lines}
        renderMenu={(props) => (
          <Menu className={clsx(optionsForm.watch('fullScreen') && 'z-60')} {...props}>
            {(['tail', 'stream', 'date', 'instance', 'wordWrap'] as const).map((option) => (
              <MenuItem key={option}>
                <ControlledCheckbox
                  control={optionsForm.control}
                  name={option}
                  label={<T id={`options.${option}`} />}
                  className="flex-1"
                />
              </MenuItem>
            ))}
          </Menu>
        )}
      />
    </FullScreen>
  );
}

type NoLogsProps = {
  deployment: ComputeDeployment;
  loading: boolean;
  filters: UseFormReturn<RuntimeLogsFilters>;
};

function NoLogs({ deployment, loading, filters }: NoLogsProps) {
  const { plan } = useOrganization();
  const periods = useRetentionPeriods();
  const period = filters.watch('period');

  if (loading) {
    return <Spinner className="size-6" />;
  }

  return (
    <>
      <p className="text-base">
        {period === 'live' ? (
          <T id="noLogs.expiredLive" />
        ) : (
          <T id="noLogs.expired" values={{ period: <T id={`retentionPeriods.${period}`} /> }} />
        )}
      </p>

      {inArray(plan, ['hobby', 'starter', 'pro', 'scale']) && period === last(periods) && (
        <p>
          <T id="noLogs.upgrade" />
        </p>
      )}

      {isDeploymentRunning(deployment) && (
        <p>
          <T id="noLogs.tailing" />
        </p>
      )}
    </>
  );
}

function useFilteredLines(lines: LogLineType[], filters: RuntimeLogsFilters, instances: Instance[]) {
  return useMemo(() => {
    return lines.filter((line) => {
      const instance = instances.find(hasProperty('id', line.instanceId));

      if (!filters.logs && line.stream !== 'koyeb') {
        return false;
      }

      if (!filters.events && line.stream === 'koyeb') {
        return false;
      }

      if (filters.region !== null && filters.region !== instance?.region) {
        return false;
      }

      if (filters.instance !== null && filters.instance !== line.instanceId) {
        return false;
      }

      return true;
    });
  }, [lines, filters, instances]);
}

function useFilteredInstances(filters: RuntimeLogsFilters, instances: Instance[]) {
  return useMemo(() => {
    if (filters.region === null) {
      return instances;
    }

    return instances.filter(hasProperty('region', filters.region));
  }, [filters, instances]);
}

function WaitingForLogs() {
  return (
    <div className="col h-full items-center justify-center gap-2 py-12">
      <img src={waitingForLogsImage} />

      <p className="font-medium">
        <T id="waitingForLogs.title" />
      </p>

      <p className="max-w-xl text-center">
        <T id="waitingForLogs.description" />
      </p>
    </div>
  );
}

type LogsHeaderProps = {
  filters: UseFormReturn<RuntimeLogsFilters>;
  options: UseFormReturn<LogOptions>;
  regions: CatalogRegion[];
  instances: Instance[];
};

function LogsHeader({ filters, options, regions, instances }: LogsHeaderProps) {
  const periods = useRetentionPeriods();
  const t = T.useTranslate();

  const formatPeriodDate = (date: Date) => format(date, 'MMM dd, hh:mm aa');

  return (
    <header className="col gap-4">
      <div>
        <T id="header.title" />
      </div>

      <div className="row flex-wrap gap-2">
        <FeatureFlag feature="logs-filters">
          <ControlledSelect
            control={filters.control}
            name="period"
            items={periods}
            getKey={identity}
            itemToString={identity}
            itemToValue={identity}
            renderItem={(period) => (
              <div className="first-letter:capitalize">
                <T id={`retentionPeriods.${period}`} />
              </div>
            )}
            renderSelectedItem={() =>
              [
                formatPeriodDate(filters.watch('start')),
                filters.watch('period') === 'live' ? t('header.now') : formatPeriodDate(filters.watch('end')),
              ].join(' - ')
            }
            onChangeEffect={(period) => {
              const now = new Date();
              const duration: Duration = {};

              if (period === '1h') duration.hours = 1;
              if (period === '6h') duration.hours = 6;
              if (period === '24h') duration.hours = 24;
              if (period === '7d') duration.days = 7;
              if (period === '30d') duration.days = 30;

              filters.setValue('start', sub(now, duration));
              filters.setValue('end', now);
            }}
            className="min-w-80"
          />
        </FeatureFlag>

        <ControlledSelect
          control={filters.control}
          name="region"
          items={regions}
          placeholder={<T id="header.allRegions" />}
          getKey={(region) => region.id}
          itemToString={(region) => region.displayName}
          itemToValue={(region) => region.id}
          onItemClick={(region) => region.id === filters.watch('region') && filters.setValue('region', null)}
          renderItem={(region) => (
            <div className="row gap-2 whitespace-nowrap">
              <RegionFlag regionId={region.id} className="size-4" />
              {region.displayName}
            </div>
          )}
          onChangeEffect={() => filters.setValue('instance', null)}
          className="min-w-48"
        />

        <Controller
          control={filters.control}
          name="instance"
          render={({ field }) => (
            <SelectInstance
              instances={instances}
              placeholder={<T id="header.allInstances" />}
              value={instances.find(hasProperty('id', field.value)) ?? null}
              onChange={(instance) => field.onChange(instance.id)}
              unselect={<T id="header.allInstances" />}
              onUnselect={() => field.onChange(null)}
              className="min-w-64"
            />
          )}
        />

        <FeatureFlag feature="logs-filters">
          <ControlledInput
            control={filters.control}
            name="search"
            type="search"
            placeholder={t('header.search')}
            className="min-w-64"
          />
        </FeatureFlag>

        <div className="row ml-auto gap-4">
          <ControlledCheckbox control={filters.control} name="logs" label={<T id="header.logs" />} />
          <ControlledCheckbox control={filters.control} name="events" label={<T id="header.events" />} />

          <IconButton
            variant="solid"
            Icon={IconFullscreen}
            onClick={() => options.setValue('fullScreen', !options.getValues('fullScreen'))}
          >
            <T id="header.fullScreen" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function useRetentionPeriods() {
  const quotas = useOrganizationQuotas();

  return useMemo(() => {
    const periods: LogsPeriod[] = ['live', '1h', '6h'];

    if (quotas?.logsRetention === undefined) {
      return periods;
    }

    if (quotas.logsRetention >= 1) {
      periods.push('24h');
    }

    if (quotas.logsRetention >= 7) {
      periods.push('7d');
    }

    if (quotas.logsRetention >= 30) {
      periods.push('30d');
    }

    return periods;
  }, [quotas]);
}

function LogLine({ options, line }: { options: LogOptions; line: LogLineType }) {
  const dateProps: Partial<React.ComponentProps<typeof LogLineDate>> = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  return (
    <div className={clsx('row px-4', line.stream === 'koyeb' && 'bg-blue/10')}>
      {options.date && <LogLineDate line={line} {...dateProps} />}
      {options.stream && <LogLineStream line={line} />}
      {options.instance && <LogLineInstanceId line={line} />}
      <LogLineContent line={line} options={options} />
    </div>
  );
}
