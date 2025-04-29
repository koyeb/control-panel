import clsx from 'clsx';
import { max, sub } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import { IconButton, Menu, MenuItem } from '@koyeb/design-system';
import { useApp, useService } from 'src/api/hooks/service';
import { Instance, LogLine } from 'src/api/model';
import { isInstanceRunning } from 'src/application/service-functions';
import { ControlledCheckbox } from 'src/components/controlled';
import { FullScreen } from 'src/components/full-screen';
import { IconFullscreen } from 'src/components/icons';
import { getInitialLogOptions, LogOptions } from 'src/components/logs/log-options';
import { LogLines, LogsFooter } from 'src/components/logs/logs';
import { QueryError } from 'src/components/query-error';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { LogsFilters, useLogs } from 'src/hooks/logs';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate, Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { NoRuntimeLogs, RuntimeLogLine } from '../deployment-logs/runtime-logs';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.drawer.instanceHistory.logs');

type InstanceLogsProps = {
  instance: Instance;
};

export function InstanceLogs({ instance }: InstanceLogsProps) {
  const app = useApp(useRouteParam('appId'));
  const service = useService(useRouteParam('serviceId'));

  const logsFilters = useFeatureFlag('logs-filters');
  const now = useMemo(() => new Date(), []);

  const start = useMemo(() => {
    return max([sub(now, logsFilters ? { hours: 1 } : { days: 30 }), instance.createdAt]);
  }, [now, logsFilters, instance.createdAt]);

  const end = useMemo(() => {
    return new Date(instance.terminatedAt ?? now);
  }, [now, instance.terminatedAt]);

  const filtersForm = useForm<LogsFilters>({
    defaultValues: {
      instanceId: instance.id,
      type: 'runtime',
      period: logsFilters ? '1h' : '30d',
      start,
      end,
      search: '',
      logs: true,
      events: true,
    },
  });

  const logs = useLogs(isInstanceRunning(instance), filtersForm.watch());

  const optionsForm = useForm<LogOptions>({
    defaultValues: () => Promise.resolve(getInitialLogOptions()),
  });

  const filterLine = useFilterLine(filtersForm.watch());

  const renderLine = useCallback((line: LogLine, options: LogOptions) => {
    return <RuntimeLogLine options={options} line={line} />;
  }, []);

  if (logs.error) {
    return <QueryError error={logs.error} className="m-4" />;
  }

  return (
    <div className="m-4 mt-0 rounded-md border">
      <FullScreen
        enabled={optionsForm.watch('fullScreen')}
        exit={() => optionsForm.setValue('fullScreen', false)}
        className="col gap-2 p-4"
      >
        <LogsHeader filtersForm={filtersForm} optionsForm={optionsForm} />

        <LogLines
          options={optionsForm.watch()}
          setOption={optionsForm.setValue}
          logs={logs}
          filterLine={filterLine}
          renderLine={renderLine}
          renderNoLogs={() => (
            <NoRuntimeLogs
              running={isInstanceRunning(instance)}
              loading={logs.loading}
              filters={filtersForm}
            />
          )}
        />

        <LogsFooter
          appName={app?.name ?? ''}
          serviceName={service?.name ?? ''}
          lines={logs.lines}
          renderMenu={(props) => (
            <Menu className={clsx(optionsForm.watch('fullScreen') && 'z-60')} {...props}>
              {(['tail', 'stream', 'date', 'wordWrap'] as const).map((option) => (
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
    </div>
  );
}

type LogsHeaderProps = {
  filtersForm: UseFormReturn<LogsFilters>;
  optionsForm: UseFormReturn<LogOptions>;
};

function LogsHeader({ filtersForm, optionsForm }: LogsHeaderProps) {
  return (
    <div className="row items-center gap-4">
      <div className="me-auto">
        <T id="title" />
      </div>

      <ControlledCheckbox control={filtersForm.control} name="logs" label={<T id="filters.logs" />} />

      <ControlledCheckbox control={filtersForm.control} name="events" label={<T id="filters.events" />} />

      <IconButton
        variant="solid"
        Icon={IconFullscreen}
        onClick={() => optionsForm.setValue('fullScreen', !optionsForm.getValues('fullScreen'))}
      />
    </div>
  );
}

function useFilterLine({ logs, events }: LogsFilters) {
  return useCallback(
    (line: LogLine) => {
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
