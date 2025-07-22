import { Alert, IconButton, Menu, MenuItem } from '@koyeb/design-system';
import clsx from 'clsx';
import { useCallback } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';

import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { App, ComputeDeployment, LogLine as LogLineType, Service } from 'src/api/model';
import { ControlledCheckbox } from 'src/components/controlled';
import { FullScreen } from 'src/components/full-screen';
import { Link } from 'src/components/link';
import { getInitialLogOptions } from 'src/components/logs/log-options';
import {
  LogLineContent,
  LogLineDate,
  LogLineStream,
  LogLines,
  LogOptions,
  LogsFooter,
} from 'src/components/logs/logs';
import waitingForLogsImage from 'src/components/logs/waiting-for-logs.gif';
import { QueryError } from 'src/components/query-error';
import { LogsApi } from 'src/hooks/logs';
import { IconFullscreen } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { AssertionError, assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

const T = createTranslate('modules.deployment.deploymentLogs.build');

type BuildLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  logs: LogsApi;
};

export function BuildLogs({ app, service, deployment, logs }: BuildLogsProps) {
  const optionsForm = useForm<LogOptions>({
    defaultValues: () => Promise.resolve(getInitialLogOptions()),
  });

  const renderLine = useCallback((line: LogLineType, options: LogOptions) => {
    return <LogLine line={line} options={options} />;
  }, []);

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
      enabled={optionsForm.watch('fullScreen')}
      exit={() => optionsForm.setValue('fullScreen', false)}
      className="col gap-2 p-4"
    >
      <LogsHeader options={optionsForm} />

      <LogLines
        options={optionsForm.watch()}
        setOption={optionsForm.setValue}
        logs={logs}
        renderLine={renderLine}
        renderNoLogs={() => <NoLogs />}
      />

      <LogsFooter
        appName={app.name}
        serviceName={service.name}
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
  const { plan } = useOrganization();
  const quotas = useOrganizationQuotas();

  return (
    <>
      <p className="text-base">
        <T id="noLogs.expired" values={{ retention: quotas?.logsRetention }} />
      </p>

      <p>{inArray(plan, ['hobby', 'starter', 'pro', 'scale']) && <T id="noLogs.upgrade" />}</p>
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
  options: UseFormReturn<LogOptions>;
};

function LogsHeader({ options }: LogsHeaderProps) {
  const quotas = useOrganizationQuotas();

  return (
    <header className="row items-center gap-4">
      <div className="mr-auto">
        <T id="header.title" values={{ retention: quotas?.logsRetention }} />
      </div>

      <IconButton
        variant="solid"
        Icon={IconFullscreen}
        onClick={() => options.setValue('fullScreen', !options.getValues('fullScreen'))}
      >
        <T id="header.fullScreen" />
      </IconButton>
    </header>
  );
}

function LogLine({ options, line }: { options: LogOptions; line: LogLineType }) {
  return (
    <div className="row px-4">
      {options.date && (
        <LogLineDate line={line} timeZone="UTC" hour="2-digit" minute="2-digit" second="2-digit" />
      )}

      {options.stream && <LogLineStream line={line} />}

      <LogLineContent line={line} options={options} />
    </div>
  );
}
