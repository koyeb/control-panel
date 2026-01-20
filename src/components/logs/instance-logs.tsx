import { IconButton, Menu } from '@koyeb/design-system';
import { Controller, UseFormReturn } from 'react-hook-form';

import { useApp, useService } from 'src/api';
import { isInstanceRunning } from 'src/application/service-functions';
import { ButtonMenuItem } from 'src/components/dropdown-menu';
import { Checkbox, ControlledCheckbox } from 'src/components/forms';
import { FullScreen } from 'src/components/full-screen';
import { QueryError } from 'src/components/query-error';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { Instance } from 'src/model';
import { arrayToggle } from 'src/utils/arrays';

import { LogLines, LogsFooter } from './logs';
import { LogsFilters, useLogsFilters } from './logs-filters';
import { LogsOptions, useLogsOptions } from './logs-options';
import { NoRuntimeLogs, RuntimeLogLine } from './runtime-logs';
import { LogStream, useLogs } from './use-logs';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.drawer.instanceHistory.logs');

type InstanceLogsProps = {
  instance: Instance;
};

export function InstanceLogs({ instance }: InstanceLogsProps) {
  const service = useService(instance.serviceId);
  const app = useApp(service?.appId);

  const optionsForm = useLogsOptions();
  const options = optionsForm.watch();

  const filtersForm = useLogsFilters('runtime', { instance });
  const filters = filtersForm.watch();

  const logs = useLogs(isInstanceRunning(instance), options.interpretAnsi ? 'interpret' : 'strip', filters);

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
          fullScreen={options.fullScreen}
          tail={options.tail}
          setTail={(tail) => optionsForm.setValue('tail', tail)}
          logs={logs}
          renderLine={(line) => <RuntimeLogLine line={line} options={options} />}
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
              {(['tail', 'stream', 'date', 'wordWrap', 'interpretAnsi'] as const).map((option) => (
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
  optionsForm: UseFormReturn<LogsOptions>;
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
