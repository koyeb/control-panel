import clsx from 'clsx';
import { useState } from 'react';

import { App, ComputeDeployment, Service } from 'src/api/model';
import { notify } from 'src/application/notify';
import { useTrackEvent } from 'src/application/posthog';
import { routes } from 'src/application/routes';
import { getServiceUrls } from 'src/application/service-functions';
import { ActionsList, ActionsListButton, ActionsListLink } from 'src/components/actions-list';
import { IconSendHorizontal, IconInfo, IconExternalLink, IconArrowRight } from 'src/components/icons';
import { TimeoutUi } from 'src/components/timeout-ui';
import { createTranslate } from 'src/intl/translate';
import { DeploymentFailedInfo } from 'src/modules/deployment/deployment-failed-info/deployment-failed-info';

const T = createTranslate('modules.serviceCreation.initialDeployment.deploymentStatusDetails');

type DeploymentStatusDetailsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function DeploymentStatusDetails({ app, service, deployment }: DeploymentStatusDetailsProps) {
  const t = T.useTranslate();
  const hasBuild = deployment.definition.source.type === 'git';

  if (hasBuild && deployment.build === undefined) {
    return (
      <TimeoutUi
        timeout={30 * 1000}
        beforeTimeout={
          <StatusDetailsCard variant="info" title={<T id="deploymentQueued.title" />}>
            <T id="deploymentQueued.details" />
          </StatusDetailsCard>
        }
        afterTimeout={
          <StatusDetailsCard variant="warning" title={<T id="deploymentQueuedLong.title" />}>
            <T id="deploymentQueuedLong.details" />
            <ReportIssueButton
              deployment={deployment}
              phase="build"
              onReported={() => notify.info(t('deploymentQueuedLong.reportSuccessNotification'))}
            >
              <T id="deploymentQueuedLong.cta" />
            </ReportIssueButton>
          </StatusDetailsCard>
        }
      />
    );
  }

  if (deployment.status === 'PENDING' || deployment.status === 'SCHEDULED') {
    return (
      <TimeoutUi
        timeout={30 * 1000}
        beforeTimeout={
          <StatusDetailsCard variant="info" title={<T id="deploymentScheduled.title" />}>
            <T id="deploymentScheduled.details" />
          </StatusDetailsCard>
        }
        afterTimeout={
          <StatusDetailsCard variant="warning" title={<T id="deploymentScheduledLong.title" />}>
            <T id="deploymentScheduledLong.details" />
            <ReportIssueButton
              deployment={deployment}
              phase="runtime"
              onReported={() => notify.info(t('deploymentScheduledLong.reportSuccessNotification'))}
            >
              <T id="deploymentScheduledLong.cta" />
            </ReportIssueButton>
          </StatusDetailsCard>
        }
      />
    );
  }

  if (deployment.status === 'HEALTHY') {
    const [url] = getServiceUrls(app, service, deployment).filter((url) => url.externalUrl !== undefined);

    return (
      <StatusDetailsCard variant="success" title={<T id="serviceReady.title" />}>
        <T id="serviceReady.details" />

        <ActionsList
          items={[
            <ActionsListLink
              key="inspect"
              Icon={IconArrowRight}
              href={routes.service.overview(service.id)}
              className="row justify-between text-xs font-medium"
            >
              <T id="serviceReady.inspectService" />
            </ActionsListLink>,

            url?.externalUrl && (
              <ActionsListLink
                key="access"
                component="a"
                Icon={IconExternalLink}
                openInNewTab
                href={`https://${url.externalUrl}`}
                className="row justify-between text-xs font-medium"
              >
                <T id="serviceReady.accessService" />
              </ActionsListLink>
            ),
          ]}
        />
      </StatusDetailsCard>
    );
  }

  return (
    <DeploymentFailedInfo
      deployment={deployment}
      layout="column"
      after={
        <ActionsList
          items={[
            <ActionsListLink
              key="inspect"
              Icon={IconArrowRight}
              href={routes.service.overview(service.id)}
              className="row justify-between text-xs font-medium"
            >
              <T id="inspectService" />
            </ActionsListLink>,
          ]}
        />
      }
      className="sticky top-4"
    />
  );
}

type ReportIssueButtonProps = {
  deployment: ComputeDeployment;
  phase: 'build' | 'runtime';
  onReported: () => void;
  children: React.ReactNode;
};

function ReportIssueButton({ deployment, phase, onReported, children }: ReportIssueButtonProps) {
  const [reported, setReported] = useState(false);
  const track = useTrackEvent();

  const reportIssue = () => {
    track('Deployment Issue', {
      category: 'Deployment',
      action: 'Clicked',
      phase,
      deploymentId: deployment.id,
    });

    setReported(true);
    onReported();
  };

  return (
    <ActionsList
      items={[
        <ActionsListButton
          key="inspect"
          disabled={reported}
          Icon={IconSendHorizontal}
          onClick={reportIssue}
          className="row justify-between text-xs font-medium"
        >
          {children}
        </ActionsListButton>,
      ]}
    />
  );
}

type StatusDetailsCardProps = {
  variant: 'info' | 'warning' | 'error' | 'success';
  title: React.ReactNode;
  children: React.ReactNode;
};

function StatusDetailsCard({ variant, title, children }: StatusDetailsCardProps) {
  return (
    <div className="sticky top-4 rounded-lg border">
      <div
        className={clsx('row items-center gap-2 rounded-t-lg px-3 py-2', {
          'bg-blue/10 text-blue': variant === 'info',
          'bg-orange/10 text-orange': variant === 'warning',
          'bg-red/10 text-red': variant === 'error',
          'bg-green/10 text-green': variant === 'success',
        })}
      >
        <IconInfo className="size-4" />
        {title}
      </div>

      <div className="col gap-4 px-3 py-4">{children}</div>
    </div>
  );
}
