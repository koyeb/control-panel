import { IconButton, Menu } from '@koyeb/design-system';
import { useCallback } from 'react';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';

import { useApp, useService } from 'src/api';
import { isInstanceRunning } from 'src/application/service-functions';
import { ButtonMenuItem } from 'src/components/dropdown-menu';
import { Checkbox, ControlledCheckbox } from 'src/components/forms';
import { FullScreen } from 'src/components/full-screen';
import { LogOptions, getInitialLogOptions } from 'src/components/logs/log-options';
import { LogLines, LogsFooter } from 'src/components/logs/logs';
import { QueryError } from 'src/components/query-error';
import { LogStream, LogsFilters, useLogs } from 'src/hooks/logs';
import { useRouteParam } from 'src/hooks/router';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { Instance, LogLine } from 'src/model';
import { arrayToggle } from 'src/utils/arrays';

import { NoRuntimeLogs, RuntimeLogLine } from '../deployment-logs/runtime-logs';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.drawer.instanceHistory.logs');

type InstanceLogsProps = {
  instance: Instance;
};

export function InstanceLogs({ instance }: InstanceLogsProps) {
  const service = useService(useRouteParam('serviceId'));
  const app = useApp(service?.appId);

  const filtersForm = useForm<LogsFilters>({
    defaultValues: {
      instanceId: instance.id,
      type: 'runtime',
      period: '30d',
      streams: ['stdout', 'stderr', 'koyeb'],
      search: '',
    },
  });

  const logs = useLogs(isInstanceRunning(instance), filtersForm.watch());

  const optionsForm = useForm<LogOptions>({
    defaultValues: () => Promise.resolve(getInitialLogOptions()),
  });

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
          menu={
            <Menu>
              {(['tail', 'stream', 'date', 'wordWrap'] as const).map((option) => (
                <ButtonMenuItem key={option}>
                  <ControlledCheckbox
                    control={optionsForm.control}
                    name={option}
                    label={<Translate id={`components.logs.options.${option}`} />}
                    className="flex-1"
                  />
                </ButtonMenuItem>
              ))}
            </Menu>
          }
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

      <Controller
        control={filtersForm.control}
        name="streams"
        render={({ field }) => (
          <>
            {(['stdout', 'stderr', 'koyeb'] satisfies LogStream[]).map((stream) => (
              <Checkbox
                key={stream}
                label={<T id={`filters.${stream}`} />}
                checked={field.value.includes(stream)}
                onChange={() => field.onChange(arrayToggle(field.value, stream))}
              />
            ))}
          </>
        )}
      />

      <IconButton
        variant="solid"
        Icon={IconFullscreen}
        onClick={() => optionsForm.setValue('fullScreen', !optionsForm.getValues('fullScreen'))}
      />
    </div>
  );
}
