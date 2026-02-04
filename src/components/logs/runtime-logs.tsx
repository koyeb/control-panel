import { Dropdown, IconButton, Menu, MenuItem, Spinner } from '@koyeb/design-system';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, UseFormReturn, UseFormSetValue } from 'react-hook-form';

import { useOrganization, useOrganizationQuotas, useRegionalDeployments, useRegionsCatalog } from 'src/api';
import { isDeploymentRunning } from 'src/application/service-functions';
import { Checkbox, ControlledCheckbox, ControlledInput, ControlledSelect } from 'src/components/forms';
import { FullScreen } from 'src/components/full-screen';
import { QueryError } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { SelectInstance } from 'src/components/selectors/select-instance';
import { FeatureFlag, useFeatureFlag } from 'src/hooks/feature-flag';
import { useNow } from 'src/hooks/timers';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Instance, LogLine as LogLineType, Service } from 'src/model';
import { arrayToggle, inArray, last } from 'src/utils/arrays';
import { defined } from 'src/utils/assert';
import { identity } from 'src/utils/generic';
import { getId, hasProperty } from 'src/utils/object';

import { LogLine, LogsLines } from './log-lines';
import { LogsFilters, useLogsFilters } from './logs-filters';
import { LogsFooter } from './logs-footer';
import { LogsOptions, useLogsOptions } from './logs-options';
import { LogStream, LogsApi, LogsPeriod, getLogsStartDate, useLogs } from './use-logs';
import waitingForLogsImage from './waiting-for-logs.gif';

const T = createTranslate('modules.deployment.deploymentLogs.runtime');

type RuntimeLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
  onLastLineChanged?: (line: LogLineType) => void;
};

export function RuntimeLogs({ app, service, deployment, instances, onLastLineChanged }: RuntimeLogsProps) {
  const { watch, setValue, control } = useLogsOptions();
  const options = watch();

  const filtersForm = useLogsFilters('runtime', { deployment });
  const filters = filtersForm.watch();

  const logs = useLogs(
    isDeploymentRunning(deployment),
    options.interpretAnsi ? 'interpret' : 'strip',
    filters,
  );

  useEffect(() => {
    const lastLine = logs.lines[logs.lines.length - 1];

    if (lastLine !== undefined) {
      onLastLineChanged?.(lastLine);
    }
  }, [logs.lines, onLastLineChanged]);

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
      enabled={options.fullScreen}
      exit={() => setValue('fullScreen', false)}
      className="col gap-2 p-4"
    >
      <LogsHeader
        deployment={deployment}
        filters={filtersForm}
        instances={instances}
        toggleFullScreen={() => setValue('fullScreen', !options.fullScreen)}
      />

      <RuntimeLogLines
        logs={logs}
        running={isDeploymentRunning(deployment)}
        filtersForm={filtersForm}
        options={options}
        setOption={setValue}
      />

      <LogsFooter
        appName={app.name}
        serviceName={service.name}
        lines={logs.lines}
        menu={
          <>
            {(['tail', 'stream', 'date', 'instance', 'wordWrap', 'interpretAnsi'] as const).map((option) => (
              <MenuItem key={option} className="p-0!">
                <ControlledCheckbox
                  control={control}
                  name={option}
                  label={<Translate id={`components.logs.options.${option}`} />}
                  className="w-full p-2 hover:bg-muted"
                />
              </MenuItem>
            ))}
          </>
        }
      />
    </FullScreen>
  );
}

type RuntimeLogLinesProps = {
  logs: LogsApi;
  running: boolean;
  filtersForm: UseFormReturn<LogsFilters>;
  options: LogsOptions;
  setOption: UseFormSetValue<LogsOptions>;
};

export function RuntimeLogLines({ logs, running, filtersForm, options, setOption }: RuntimeLogLinesProps) {
  const onScrollTop = logs.loadPrevious;

  const onScrollBottom = useCallback(() => {
    setOption('tail', true);
  }, [setOption]);

  if (logs.lines.length === 0) {
    return (
      <div
        className={clsx(
          'col h-128 items-center justify-center gap-2 rounded-md border',
          options.fullScreen && 'flex-1',
        )}
      >
        <NoRuntimeLogs running={running} loading={logs.loading} filters={filtersForm} />
      </div>
    );
  }

  const dateFormat: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  return (
    <LogsLines
      lines={logs.lines}
      hasPrevious={logs.hasPrevious}
      tail={options.tail}
      renderLine={(line) => (
        <LogLine
          line={line}
          showDate={options.date}
          dateFormat={dateFormat}
          showStream={options.stream}
          wordWrap={options.wordWrap}
        />
      )}
      onWheel={(event) => event.deltaY < 0 && setOption('tail', false)}
      onScrollToTop={onScrollTop}
      onScrollToBottom={onScrollBottom}
      className={clsx('h-128 resize-y', options.fullScreen && 'flex-1')}
    />
  );
}

type NoRuntimeLogsProps = {
  running: boolean;
  loading: boolean;
  filters: UseFormReturn<LogsFilters>;
};

export function NoRuntimeLogs({ running, loading, filters }: NoRuntimeLogsProps) {
  const organization = useOrganization();
  const periods = useRetentionPeriods();
  const hasLogsFilters = useFeatureFlag('logs-filters');
  const period = hasLogsFilters ? filters.watch('period') : defined(last(periods));

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
  instances: Instance[];
  filters: UseFormReturn<LogsFilters>;
  toggleFullScreen: () => void;
};

function LogsHeader({ deployment, instances, filters, toggleFullScreen }: LogsHeaderProps) {
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
          getValue={getId}
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

        <FeatureFlag feature="logs-search">
          <ControlledInput
            control={filters.control}
            name="search"
            type="search"
            placeholder={t('header.search')}
            className="max-w-64"
          />
        </FeatureFlag>

        <div className="ml-auto row gap-4">
          <Controller
            control={filters.control}
            name="streams"
            render={({ field }) => (
              <>
                {(['stdout', 'stderr', 'koyeb'] satisfies LogStream[]).map((stream) => (
                  <Checkbox
                    key={stream}
                    label={<T id={`header.${stream}`} />}
                    checked={field.value.includes(stream)}
                    onChange={() => field.onChange(arrayToggle(field.value, stream))}
                  />
                ))}
              </>
            )}
          />

          <IconButton variant="solid" Icon={IconFullscreen} onClick={toggleFullScreen}>
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
  const t = T.useTranslate();

  const periods = useRetentionPeriods();
  const end = useNow();

  const formatPeriodDate = (date: Date) => format(date, 'MMM dd, hh:mm aa');

  const renderPeriod = (period: LogsPeriod | null) => {
    if (period === null) {
      return null;
    }

    return [
      formatPeriodDate(getLogsStartDate(end, period)),
      period === 'live' ? t('header.now') : formatPeriodDate(end),
    ].join(' - ');
  };

  return (
    <ControlledSelect
      control={filters.control}
      name="period"
      items={periods}
      getValue={identity}
      renderValue={renderPeriod}
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
