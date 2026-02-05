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

import { LogsFilters, useLogsFilters } from './logs-filters';
import { LogsFooter } from './logs-footer';
import { useLogsOptions } from './logs-options';
import { RuntimeLogLines } from './runtime-logs';
import { LogStream, useLogs } from './use-logs';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.drawer.instanceHistory.logs');

type InstanceLogsProps = {
  instance: Instance;
};

export function InstanceLogs({ instance }: InstanceLogsProps) {
  const service = useService(instance.serviceId);
  const app = useApp(service?.appId);

  const { watch, setValue, control } = useLogsOptions();
  const options = watch();

  const filtersForm = useLogsFilters('runtime', { instance });
  const filters = filtersForm.watch();

  const logs = useLogs({
    deploymentId: filters.deploymentId ?? undefined,
    instanceId: filters.instanceId ?? undefined,
    type: filters.type,
    streams: filters.streams,
    search: filters.search,
    tail: isInstanceRunning(instance),
    ansiMode: options.interpretAnsi ? 'interpret' : 'strip',
  });

  if (logs.error) {
    return <QueryError error={logs.error} className="m-4" />;
  }

  return (
    <div className="m-4 mt-0 rounded-md border">
      <FullScreen
        enabled={watch('fullScreen')}
        exit={() => setValue('fullScreen', false)}
        className="col gap-2 p-4"
      >
        <LogsHeader
          filtersForm={filtersForm}
          toggleFullScreen={() => setValue('fullScreen', options.fullScreen)}
        />

        <RuntimeLogLines
          tailing={logs.stream === 'connected'}
          logs={logs}
          options={options}
          setOption={setValue}
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
                    control={control}
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
  toggleFullScreen: () => void;
};

function LogsHeader({ filtersForm, toggleFullScreen }: LogsHeaderProps) {
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

      <IconButton variant="solid" Icon={IconFullscreen} onClick={toggleFullScreen} />
    </div>
  );
}
