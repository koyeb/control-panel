import { isBefore, sub } from 'date-fns';
import { useCallback } from 'react';

import { Alert } from '@koyeb/design-system';
import { App, ComputeDeployment, LogLine as LogLineType, Service } from 'src/api/model';
import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { LogLineContent, LogLineDate, LogLineStream, LogOptions, Logs } from 'src/components/logs/logs';
import waitingForLogsImage from 'src/components/logs/waiting-for-logs.gif';
import { createTranslate, Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { AssertionError, assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

const T = createTranslate('deploymentLogs.build');

type BuildLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  error?: unknown;
  lines: LogLineType[];
};

export function BuildLogs({ app, service, deployment, error, lines }: BuildLogsProps) {
  const renderLine = useCallback((line: LogLineType, options: LogOptions) => {
    return <LogLine line={line} options={options} />;
  }, []);

  if (deployment.buildSkipped) {
    return <BuiltInPreviousDeployment service={service} />;
  }

  if (error) {
    if (typeof error === 'string') {
      return error;
    }

    return <Translate id="common.unknownError" />;
  }

  const waitingForLogs = lines.length === 0;
  const expired = isBefore(new Date(deployment.date), sub(new Date(), { hours: 72 }));

  if (waitingForLogs && inArray(deployment.status, ['pending', 'provisioning'])) {
    return <WaitingForLogs />;
  }

  return (
    <Logs
      appName={app.name}
      serviceName={service.name}
      expired={expired}
      lines={lines}
      renderLine={renderLine}
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
