import { Alert, IconButton, Menu } from '@koyeb/design-system';
import { useEffect } from 'react';

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

import { LogLineContent, LogLineDate, LogLineStream, LogLines, LogsFooter } from './logs';
import { useLogsFilters } from './logs-filters';
import { LogsOptions, useLogsOptions } from './logs-options';
import { useLogs } from './use-logs';
import waitingForLogsImage from './waiting-for-logs.gif';

const T = createTranslate('modules.deployment.deploymentLogs.build');

type BuildLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  onLastLineChanged: (line: LogLineType) => void;
};

export function BuildLogs({ app, service, deployment, onLastLineChanged }: BuildLogsProps) {
  const optionsForm = useLogsOptions();
  const options = optionsForm.watch();

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
    return <BuiltInPreviousDeployment service={service} />;
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
      exit={() => optionsForm.setValue('fullScreen', false)}
      className="col gap-2 p-4"
    >
      <LogsHeader toggleFullScreen={() => optionsForm.setValue('fullScreen', !options.fullScreen)} />

      <LogLines
        fullScreen={options.fullScreen}
        tail={options.tail}
        setTail={(tail) => optionsForm.setValue('tail', tail)}
        logs={logs}
        renderLine={(line) => <LogLine line={line} options={options} />}
        renderNoLogs={() => <NoLogs />}
      />

      <LogsFooter
        appName={app.name}
        serviceName={service.name}
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

function NoLogs() {
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

function BuiltInPreviousDeployment({ service }: { service: Service }) {
  const deploymentId = service.lastProvisionedDeploymentId;

  assert(
    deploymentId !== undefined,
    new AssertionError(`service ${service.id} has no last provisioned deployment id`),
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
                search={{ deploymentId: service.lastProvisionedDeploymentId }}
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

function LogLine({ options, line }: { options: LogsOptions; line: LogLineType }) {
  return (
    <div className="row px-4">
      {options.date && (
        <LogLineDate line={line} timeZone="UTC" hour="2-digit" minute="2-digit" second="2-digit" />
      )}

      {options.stream && <LogLineStream line={line} />}

      <LogLineContent line={line} wordWrap={options.wordWrap} />
    </div>
  );
}
