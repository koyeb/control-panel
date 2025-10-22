import { IconButton, Spinner } from '@koyeb/design-system';
import { Dropdown, Menu, MenuItem } from '@koyeb/design-system/next';
import clsx from 'clsx';
import { Duration, format, sub } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';

import { useOrganization, useOrganizationQuotas, useRegionalDeployments, useRegionsCatalog } from 'src/api';
import { isDeploymentRunning } from 'src/application/service-functions';
import { ControlledCheckbox, ControlledInput, ControlledSelect } from 'src/components/forms';
import { FullScreen } from 'src/components/full-screen';
import { getInitialLogOptions } from 'src/components/logs/log-options';
import {
  LogLineContent,
  LogLineDate,
  LogLineInstanceId,
  LogLineStream,
  LogLines,
  LogOptions,
  LogsFooter,
} from 'src/components/logs/logs';
import waitingForLogsImage from 'src/components/logs/waiting-for-logs.gif';
import { QueryError } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { SelectInstance } from 'src/components/select-instance';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { LogsApi, LogsFilters, LogsPeriod } from 'src/hooks/logs';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Instance, LogLine, LogLine as LogLineType, Service } from 'src/model';
import { inArray, last } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';
import { getId, hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.deploymentLogs.runtime');

type RuntimeLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
  filters: UseFormReturn<LogsFilters>;
  logs: LogsApi;
};

export function RuntimeLogs({ app, service, deployment, instances, filters, logs }: RuntimeLogsProps) {
  const optionsForm = useForm<LogOptions>({
    defaultValues: () => Promise.resolve(getInitialLogOptions()),
  });

  const filterLine = useFilterLine(filters.watch());

  const renderLine = useCallback((line: LogLineType, options: LogOptions) => {
    return <RuntimeLogLine options={options} line={line} />;
  }, []);

  if (logs.error) {
    return <QueryError error={logs.error} className="m-4" />;
  }

  if (
    logs.lines.length === 0 &&
    inArray(deployment.status, ['PENDING', 'PROVISIONING', 'SCHEDULED', 'ALLOCATING'])
  ) {
    return <WaitingForLogs />;
  }

  return (
    <FullScreen
      enabled={optionsForm.watch('fullScreen')}
      exit={() => optionsForm.setValue('fullScreen', false)}
      className="col gap-2 p-4"
    >
      <LogsHeader deployment={deployment} filters={filters} options={optionsForm} instances={instances} />

      <LogLines
        options={optionsForm.watch()}
        setOption={optionsForm.setValue}
        logs={logs}
        filterLine={filterLine}
        renderLine={renderLine}
        renderNoLogs={() => (
          <NoRuntimeLogs running={isDeploymentRunning(deployment)} loading={logs.loading} filters={filters} />
        )}
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
                  label={<Translate id={`components.logs.options.${option}`} />}
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

function useFilterLine({ logs, events }: LogsFilters) {
  return useCallback(
    (line: LogLineType) => {
      if (!logs && inArray(line.stream, ['stdout', 'stderr'])) {
        return false;
      }

      if (!events && inArray(line.stream, ['koyeb'])) {
        return false;
      }

      return true;
    },
    [logs, events],
  );
}

type NoLogsProps = {
  running: boolean;
  loading: boolean;
  filters: UseFormReturn<LogsFilters>;
};

export function NoRuntimeLogs({ running, loading, filters }: NoLogsProps) {
  const organization = useOrganization();
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

      {inArray(organization?.plan, ['hobby', 'starter', 'pro', 'scale']) && period === last(periods) && (
        <p>
          <T id="noLogs.upgrade" />
        </p>
      )}

      {running && (
        <p>
          <T id="noLogs.tailing" />
        </p>
      )}
    </>
  );
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
  deployment: ComputeDeployment;
  filters: UseFormReturn<LogsFilters>;
  options: UseFormReturn<LogOptions>;
  instances: Instance[];
};

function LogsHeader({ deployment, filters, options, instances }: LogsHeaderProps) {
  const regionalDeployments = useRegionalDeployments(deployment.id);
  const regions = useRegionsCatalog();
  const t = T.useTranslate();

  return (
    <header className="col gap-4">
      <div>
        <T id="header.title" />
      </div>

      <div className="row flex-wrap gap-2">
        <FeatureFlag feature="logs-filters">
          <SelectPeriod filters={filters} />
        </FeatureFlag>

        <ControlledSelect
          control={filters.control}
          name="regionalDeploymentId"
          items={regionalDeployments ?? []}
          placeholder={<T id="header.allRegions" />}
          getKey={getId}
          itemToString={({ id }) => regions.find(hasProperty('id', id))?.name ?? ''}
          itemToValue={getId}
          onItemClick={({ id }) =>
            id === filters.watch('regionalDeploymentId') && filters.setValue('regionalDeploymentId', null)
          }
          renderItem={({ region }) => (
            <div className="row gap-2 whitespace-nowrap">
              <RegionFlag regionId={region} className="size-4" />
              <RegionName regionId={region} className="size-4" />
            </div>
          )}
          className="min-w-48"
        />

        <Controller
          control={filters.control}
          name="instanceId"
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

        <div className="ml-auto row gap-4">
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

type SelectPeriodProps = {
  filters: UseFormReturn<LogsFilters>;
};

function SelectPeriod({ filters }: SelectPeriodProps) {
  const periods = useRetentionPeriods();
  const t = T.useTranslate();

  const formatPeriodDate = (date: Date) => format(date, 'MMM dd, hh:mm aa');

  const renderPeriod = (period: LogsPeriod | null) => {
    if (period === null) {
      return null;
    }

    return [
      formatPeriodDate(filters.watch('start')),
      period === 'live' ? t('header.now') : formatPeriodDate(filters.watch('end')),
    ].join(' - ');
  };

  return (
    <ControlledSelect
      control={filters.control}
      name="period"
      items={periods}
      itemToValue={identity}
      renderValue={renderPeriod}
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
      menu={({ select, dropdown }) => (
        <Dropdown dropdown={dropdown}>
          <Menu {...select.getMenuProps()}>
            {periods.map((period, index) => (
              <MenuItem
                {...select.getItemProps({ item: period, index })}
                key={index}
                highlighted={index === select.highlightedIndex}
                className="first-letter:capitalize"
              >
                <T id={`retentionPeriods.${period}`} />
              </MenuItem>
            ))}
          </Menu>
        </Dropdown>
      )}
      className="min-w-80"
    />
  );
}

function useRetentionPeriods() {
  const quotas = useOrganizationQuotas();

  return useMemo(() => {
    const periods: LogsPeriod[] = ['live', '1h', '6h'];

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

export function RuntimeLogLine({ options, line }: { options: LogOptions; line: LogLine }) {
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
      {options.date && <LogLineDate line={line} timeZone="UTC" {...dateProps} />}
      {options.stream && <LogLineStream line={line} />}
      {options.instance && <LogLineInstanceId line={line} />}
      <LogLineContent line={line} options={options} />
    </div>
  );
}
