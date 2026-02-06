import { IconButton, MenuItem, Spinner } from '@koyeb/design-system';
import clsx from 'clsx';
import { useEffect } from 'react';
import { Controller, UseFormReturn, UseFormSetValue } from 'react-hook-form';

import { useOrganization, useOrganizationQuotas } from 'src/api';
import { isDeploymentRunning } from 'src/application/service-functions';
import { Checkbox, ControlledCheckbox, ControlledInput } from 'src/components/forms';
import { FullScreen } from 'src/components/full-screen';
import { QueryError } from 'src/components/query-error';
import { SelectInstance } from 'src/components/selectors/select-instance';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Instance, LogLine as LogLineType, Service } from 'src/model';
import { arrayToggle, inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

import { RegionsSelector } from '../selectors/regions-selector';

import { LogLine, LogsLines } from './log-lines';
import { LogsFilters, useLogsFilters } from './logs-filters';
import { LogsFooter } from './logs-footer';
import { LogsOptions, useLogsOptions } from './logs-options';
import { LogStream, LogsApi, useLogs } from './use-logs';
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

  const logs = useLogs({
    deploymentId: filters.deploymentId ?? undefined,
    instanceId: filters.instanceId ?? undefined,
    type: filters.type,
    regions: filters.regions,
    streams: filters.streams,
    search: filters.search,
    tail: isDeploymentRunning(deployment),
    ansiMode: options.interpretAnsi ? 'interpret' : 'strip',
  });

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
        tailing={logs.stream === 'connected'}
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
  tailing: boolean;
  options: LogsOptions;
  setOption: UseFormSetValue<LogsOptions>;
};

export function RuntimeLogLines({ logs, tailing, options, setOption }: RuntimeLogLinesProps) {
  if (logs.lines.length === 0) {
    return (
      <div
        className={clsx(
          'col h-128 items-center justify-center gap-2 rounded-md border',
          options.fullScreen && 'flex-1',
        )}
      >
        <NoRuntimeLogs tailing={tailing} loading={logs.loading} />
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
          showInstanceId={options.instance}
          wordWrap={options.wordWrap}
        />
      )}
      onWheel={(event) => event.deltaY < 0 && setOption('tail', false)}
      onScrollToTop={() => void logs.loadPrevious()}
      onScrollToBottom={() => setOption('tail', true)}
      className={clsx('h-128 resize-y', options.fullScreen && 'flex-1')}
    />
  );
}

type NoRuntimeLogsProps = {
  tailing: boolean;
  loading: boolean;
};

export function NoRuntimeLogs({ tailing, loading }: NoRuntimeLogsProps) {
  const organization = useOrganization();
  const quotas = useOrganizationQuotas();

  if (loading) {
    return <Spinner className="size-6" />;
  }

  return (
    <>
      <p className="text-base">
        <T id="noLogs.expired" values={{ days: quotas.logsRetention }} />
      </p>

      {organization?.plan !== 'enterprise' && (
        <p>
          <T id="noLogs.upgrade" />
        </p>
      )}

      {tailing && (
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
  const t = T.useTranslate();

  return (
    <header className="col gap-4">
      <div>
        <T id="header.title" />
      </div>

      <div className="row flex-wrap gap-2">
        <Controller
          control={filters.control}
          name="regions"
          render={({ field }) => (
            <RegionsSelector
              label={<T id="header.regions" />}
              regions={deployment.definition.regions}
              value={field.value}
              onChange={field.onChange}
              dropdown={{ floating: { placement: 'bottom-start' }, matchReferenceSize: false }}
              className="min-w-48"
            />
          )}
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
