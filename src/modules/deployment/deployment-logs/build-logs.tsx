import { isBefore, sub } from 'date-fns';
import { useCallback } from 'react';

import { Alert } from '@koyeb/design-system';
import { App, ComputeDeployment, LogLine as LogLineType, Service } from 'src/api/model';
import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { LogLineContent, LogLineDate, LogLineStream, LogOptions, Logs } from 'src/components/logs/logs';
import waitingForLogsImage from 'src/components/logs/waiting-for-logs.gif';
import { LogsApi } from 'src/hooks/logs';
import { createTranslate, Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { assert, AssertionError } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

const T = createTranslate('modules.deployment.deploymentLogs.build');

type BuildLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  logs: LogsApi;
};

export function BuildLogs({ app, service, deployment, logs }: BuildLogsProps) {
  const { error, lines } = logs;

  const renderLine = useCallback((line: LogLineType, options: LogOptions) => {
    return <LogLine line={line} options={options} />;
  }, []);

  if (deployment.buildSkipped) {
    return <BuiltInPreviousDeployment service={service} />;
  }

  if (error) {
    return <Translate id="common.errorMessage" values={{ message: error.message }} />;
  }

  if (lines.length === 0 && inArray(deployment.status, ['pending', 'provisioning'])) {
    return <WaitingForLogs />;
  }

  const renderNoLogs = () => {
    const expired = isBefore(new Date(deployment.date), sub(new Date(), { hours: 72 }));

    if (expired) {
      return <>Logs have expired</>;
    }

    return <>No logs</>;
  };

  return (
    <Logs
      appName={app.name}
      serviceName={service.name}
      logs={logs}
      renderLine={renderLine}
      renderNoLogs={renderNoLogs}
    />
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
                href={routes.service.overview(service.id, service.lastProvisionedDeploymentId)}
                className="underline"
              >
                {children}
              </Link>
            ),
            deploymentId: shortId(deploymentId),
          }}
        />
      }
    />
  );
}

function LogLine({ options, line }: { options: LogOptions; line: LogLineType }) {
  return (
    <div className="row px-4">
      {options.date && <LogLineDate line={line} hour="2-digit" minute="2-digit" second="2-digit" />}
      {options.stream && <LogLineStream line={line} />}
      <LogLineContent line={line} options={options} />
    </div>
  );
}
