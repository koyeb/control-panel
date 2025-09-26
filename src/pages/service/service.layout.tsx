import { TabButtons } from '@koyeb/design-system';

import { ApiError } from 'src/api/api-errors';
import { useAppQuery } from 'src/api/hooks/app';
import { useDeploymentQuery, useServiceQuery } from 'src/api/hooks/service';
import { App, Deployment, Service } from 'src/api/model';
import { getServiceUrls } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { DocumentTitle } from 'src/components/document-title';
import { ExternalLink, LinkButton, TabButtonLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useRouteParam } from 'src/hooks/router';
import { useServiceName } from 'src/hooks/service';
import { IconArrowLeft } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { useServiceCommands } from 'src/modules/command-palette';

import { DeploymentThrottledAlert } from './deployment-throttled-alert';
import { InstanceAvailabilityAlerts } from './instance-availability-alerts';
import { PendingChangesAlert } from './pending-changes-alert';
import { RedeployButton } from './redeploy-button';
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
