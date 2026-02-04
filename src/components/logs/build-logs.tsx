import { Alert, IconButton, Menu } from '@koyeb/design-system';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { useOrganization, useOrganizationQuotas } from 'src/api';
import { ControlledCheckbox } from 'src/components/forms';
import { FullScreen } from 'src/components/full-screen';
import { Link } from 'src/components/link';
import { QueryError } from 'src/components/query-error';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, LogLine as LogLineType, Service } from 'src/model';
import { inArray } from 'src/utils/arrays';
import { AssertionError, assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

import { ButtonMenuItem } from '../dropdown-menu';

import { LogLine, LogsLines } from './log-lines';
import { useLogsFilters } from './logs-filters';
import { LogsFooter } from './logs-footer';
import { LogsOptions, useLogsOptions } from './logs-options';
import { LogsApi, useLogs } from './use-logs';
import waitingForLogsImage from './waiting-for-logs.gif';

const T = createTranslate('modules.deployment.deploymentLogs.build');

type BuildLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  onLastLineChanged: (line: LogLineType) => void;
};

export function BuildLogs({ app, service, deployment, onLastLineChanged }: BuildLogsProps) {
  const { setValue, watch, control } = useLogsOptions();
  const options = watch();

  const filtersForm = useLogsFilters('build', { deployment });
  const filters = filtersForm.watch();

  const logs = useLogs(
    deployment.build?.status === 'RUNNING',
    options.interpretAnsi ? 'interpret' : 'strip',
    filters,
  );

  useEffect(() => {
    const lastLine = logs.lines[logs.lines.length - 1];

    if (lastLine !== undefined) {
      onLastLineChanged(lastLine);
    }
  }, [logs.lines, onLastLineChanged]);

  if (deployment.buildSkipped) {
    return <BuiltInPreviousDeployment service={service} deployment={deployment} />;
  }

  if (logs.error) {
    return <QueryError error={logs.error} className="m-4" />;
  }

  if (logs.lines.length === 0 && inArray(deployment.status, ['PENDING', 'PROVISIONING'])) {
    return <WaitingForLogs />;
  }

  return (
    <FullScreen
      enabled={options.fullScreen}
      exit={() => setValue('fullScreen', false)}
      className="col gap-2 p-4"
    >
      <LogsHeader toggleFullScreen={() => setValue('fullScreen', !options.fullScreen)} />

      <BuildLogLines logs={logs} options={options} setOption={setValue} />

      <LogsFooter
        appName={app.name}
        serviceName={service.name}
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

type RuntimeLogLinesProps = {
  logs: LogsApi;
  options: LogsOptions;
  setOption: UseFormSetValue<LogsOptions>;
};

function BuildLogLines({ logs, options, setOption }: RuntimeLogLinesProps) {
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
        <NoBuildLogs />
      </div>
    );
  }

  return (
    <LogsLines
      lines={logs.lines}
      hasPrevious={logs.hasPrevious}
      tail={options.tail}
      renderLine={(line) => (
        <LogLine
          line={line}
          showDate={options.date}
          dateFormat={{ timeStyle: 'medium' }}
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

function NoBuildLogs() {
  const organization = useOrganization();
  const quotas = useOrganizationQuotas();

  return (
    <>
      <p className="text-base">
        <T id="noLogs.expired" values={{ retention: quotas.logsRetention }} />
      </p>

      <p>{inArray(organization?.plan, ['hobby', 'starter', 'pro', 'scale']) && <T id="noLogs.upgrade" />}</p>
    </>
  );
}

type BuiltInPreviousDeploymentProps = {
  service: Service;
  deployment: ComputeDeployment;
};

function BuiltInPreviousDeployment({ service, deployment }: BuiltInPreviousDeploymentProps) {
  const deploymentId = deployment.lastProvisionedDeploymentId;

  assert(
    deploymentId !== undefined,
    new AssertionError(`deployment ${deployment.id} has no last provisioned deployment id`),
  );

  return (
    <Alert
      variant="info"
      style="outline"
      description={
        <T
          id="buildSkipped"
          values={{
            link: (children) => (
              <Link
                to="/services/$serviceId"
                params={{ serviceId: service.id }}
                search={{ deploymentId }}
                className="underline"
              >
                {children}
              </Link>
            ),
            deploymentId: shortId(deploymentId),
          }}
        />
      }
      className="m-4"
    />
  );
}

type LogsHeaderProps = {
  toggleFullScreen: () => void;
};

function LogsHeader({ toggleFullScreen }: LogsHeaderProps) {
  const quotas = useOrganizationQuotas();

  return (
    <header className="row items-center gap-4">
      <div className="mr-auto">
        <T id="header.title" values={{ retention: quotas.logsRetention }} />
      </div>

      <IconButton variant="solid" Icon={IconFullscreen} onClick={toggleFullScreen}>
        <T id="header.fullScreen" />
      </IconButton>
    </header>
  );
}
