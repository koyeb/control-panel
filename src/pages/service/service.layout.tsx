import { Button, TabButtons } from '@koyeb/design-system';
import { useMatch } from '@tanstack/react-router';

import { ApiError, useAppQuery, useDeploymentQuery, useServiceQuery } from 'src/api';
import { getServiceUrls } from 'src/application/service-functions';
import { CliInfoButton, CliInfoTooltip } from 'src/components/cli-info';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { openDialog } from 'src/components/dialog';
import { DocumentTitle } from 'src/components/document-title';
import { ExternalLink, LinkButton, TabButtonLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useRouteParam } from 'src/hooks/router';
import { useServiceName } from 'src/hooks/service';
import { IconArrowLeft } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, Deployment, Service } from 'src/model';
import { useServiceCommands } from 'src/modules/command-palette';

import { DeploymentThrottledAlert } from './deployment-throttled-alert';
import { InstanceAvailabilityAlerts } from './instance-availability-alerts';
import { PendingChangesAlert } from './pending-changes-alert';
import { RedeployServiceDialog } from './redeploy-button';
import { ResumeServiceDialog } from './resume-service-dialog';
import { ServiceErrorAlert } from './service-error-alert';
import { ServicePausedAlert } from './service-paused-alert';

const T = createTranslate('pages.service.layout');

type ServiceLayoutProps = {
  children: React.ReactNode;
};

export function ServiceLayout({ children }: ServiceLayoutProps) {
  const serviceId = useRouteParam('serviceId');

  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);
  const activeDeploymentQuery = useDeploymentQuery(serviceQuery.data?.activeDeploymentId);
  const serviceName = useServiceName(serviceId);

  if (serviceQuery.isError && ApiError.is(serviceQuery.error, 404)) {
    return <ServiceNotFound />;
  }

  if (appQuery.isPending || serviceQuery.isPending) {
    return <Loading />;
  }

  if (appQuery.isError) {
    return <QueryError error={appQuery.error} />;
  }

  if (serviceQuery.isError) {
    return <QueryError error={serviceQuery.error} />;
  }

  if (activeDeploymentQuery.isError) {
    return <QueryError error={activeDeploymentQuery.error} />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;
  const activeDeployment = activeDeploymentQuery.data;

  return (
    <div className="col gap-8">
      <DocumentTitle title={serviceName ?? undefined} />
      <RegisterServiceCommands service={service} />

      <RedeployServiceDialog />
      <ResumeServiceDialog />

      <div className="col items-start justify-between gap-4 sm:row">
        <Header app={app} service={service} deployment={activeDeployment} />
        <RedeployButton app={app} service={service} />
      </div>

      <ServiceErrorAlert service={service} />
      <ServicePausedAlert service={service} />
      <PendingChangesAlert service={service} />
      <InstanceAvailabilityAlerts service={service} />
      <DeploymentThrottledAlert service={service} />

      <Navigation />

      {children}
    </div>
  );
}

function ServiceNotFound() {
  return (
    <div className="col min-h-24 items-start justify-center gap-6">
      <div className="col gap-2">
        <h1 className="text-xl font-semibold">
          <T id="serviceNotFound.title" />
        </h1>
        <p className="max-w-lg text-dim">
          <T id="serviceNotFound.description" />
        </p>
      </div>

      <LinkButton to="/">
        <IconArrowLeft />
        <T id="serviceNotFound.cta" />
      </LinkButton>
    </div>
  );
}

function RegisterServiceCommands({ service }: { service: Service }) {
  useServiceCommands(service);
  return null;
}

type HeaderProps = {
  app: App;
  service: Service;
  deployment?: Deployment;
};

function Header({ app, service, deployment }: HeaderProps) {
  const url = getServiceUrls(app, service, deployment).find((url) => url.externalUrl !== undefined);

  return (
    <div className="row max-w-full min-w-0 items-center gap-2">
      <ServiceTypeIcon type={service.type} size="big" />

      <div className="col min-w-0 gap-1">
        <div className="row items-center gap-2">
          <div className="truncate typo-heading">{service.name}</div>
          <CopyIconButton text={`${app.name}/${service.name}`} className="size-4" />
        </div>

        <div className="row gap-2 text-dim">
          <div className="whitespace-nowrap">
            <TranslateEnum enum="serviceType" value={service.type} />
          </div>

          {url !== undefined && (
            <>
              <div className="border-l" />
              <ExternalLink openInNewTab href={`https://${url.externalUrl}`} className="truncate text-link">
                {url.externalUrl}
              </ExternalLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RedeployButton({ app, service }: { app: App; service: Service }) {
  const isServiceSettings = useMatch({ from: '/_main/services/$serviceId/settings', shouldThrow: false });

  if (isServiceSettings || service.status === 'PAUSED') {
    return null;
  }

  return (
    <CliInfoButton
      button={
        <Button onClick={() => openDialog('RedeployService', service)} className="self-stretch sm:self-start">
          <T id="redeploy" />
        </Button>
      }
      tooltip={
        <CliInfoTooltip
          title={<T id="redeployCli.title" />}
          description={<T id="redeployCli.description" />}
          command={`koyeb service redeploy ${app.name}/${service.name}`}
        />
      }
    />
  );
}

function Navigation() {
  const serviceId = useRouteParam('serviceId');

  return (
    <TabButtons className="self-start">
      <TabButtonLink to="/services/$serviceId" params={{ serviceId }}>
        <T id="navigation.overview" />
      </TabButtonLink>

      <TabButtonLink to="/services/$serviceId/metrics" params={{ serviceId }}>
        <T id="navigation.metrics" />
      </TabButtonLink>

      <TabButtonLink to="/services/$serviceId/console" params={{ serviceId }}>
        <T id="navigation.console" />
      </TabButtonLink>

      <TabButtonLink to="/services/$serviceId/settings" params={{ serviceId }}>
        <T id="navigation.settings" />
      </TabButtonLink>
    </TabButtons>
  );
}
