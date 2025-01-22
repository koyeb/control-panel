import { useMutation } from '@tanstack/react-query';

import { Alert, Button, TabButtons } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useAppQuery, useDeploymentQuery, useServiceQuery } from 'src/api/hooks/service';
import { App, Deployment, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { getServiceUrls } from 'src/application/service-functions';
import { useToken } from 'src/application/token';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { DocumentTitle } from 'src/components/document-title';
import { ExternalLink, TabButtonLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useNavigate, usePathname, useRouteParam } from 'src/hooks/router';
import { useServiceName } from 'src/hooks/service';
import { createTranslate, Translate } from 'src/intl/translate';
import { useRegisterCommand } from 'src/modules/command-palette/command-palette-context';
import { inArray } from 'src/utils/arrays';

import { PendingChangesAlert } from './pending-changes-alert';
import { RedeployButton } from './redeploy-button';
import { ServiceErrorAlert } from './service-error-alert';

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
      <ServiceCommands service={service} />

      <div className="col sm:row items-start justify-between gap-4">
        <Header app={app} service={service} deployment={activeDeployment} />
        <RedeployButton app={app} service={service} />
      </div>

      <ServiceErrorAlert service={service} />
      <ServicePausedAlert service={service} />
      <PendingChangesAlert service={service} />

      <Navigation />

      {children}
    </div>
  );
}

function ServiceCommands({ service }: { service: Service }) {
  const invalidate = useInvalidateApiQuery();
  const { token } = useToken();
  const { id: serviceId, name } = service;
  const navigate = useNavigate();

  useRegisterCommand(
    (register) => {
      const invalidateService = async () => {
        await invalidate('listServices');
        await invalidate('getService', { path: { id: service.id } });
      };

      register({
        label: `Go to dashboard`,
        description: `Navigate to the ${name} service's dashboard page`,
        keywords: ['overview', 'dashboard', 'deployments', 'logs', 'build', 'runtime'],
        execute: () => navigate(routes.service.overview(service.id)),
      });

      register({
        label: `Go to metrics`,
        description: `Navigate to the ${name} service's metrics page`,
        keywords: ['metrics', 'monitoring', 'graphs', 'charts'],
        execute: () => navigate(routes.service.metrics(service.id)),
      });

      register({
        label: `Go to console`,
        description: `Navigate to the ${name} service's console page`,
        keywords: ['console', 'shell', 'terminal', 'command', 'execute', 'run', 'ssh'],
        execute: () => navigate(routes.service.console(service.id)),
      });

      register({
        label: `Go to settings`,
        description: `Navigate to the ${name} service's settings page`,
        keywords: ['settings', 'update'],
        execute: () => navigate(routes.service.settings(service.id)),
      });

      register({
        label: `Redeploy service`,
        description: `Redeploy ${name}'s latest deployment`,
        keywords: ['redeploy', 'restart'],
        async execute() {
          await api.redeployService({ token, path: { id: service.id }, body: {} });
          await invalidateService();
          notify.success(`Service ${name} is being redeployed`);
        },
      });

      if (service.status === 'paused') {
        register({
          label: `Resume service ${name}`,
          description: `Resume ${name}`,
          keywords: ['resume', 'start'],
          execute: async () => {
            await api.resumeService({ token, path: { id: service.id } });
            await invalidateService();
            notify.success(`Service ${name} is being resumed`);
          },
        });
      } else if (inArray(service.status, ['healthy', 'degraded'])) {
        register({
          label: `Pause service ${name}`,
          description: `Pause ${name}`,
          keywords: ['pause', 'stop'],
          execute: async () => {
            await api.pauseService({ token, path: { id: service.id } });
            await invalidateService();
            notify.success(`Service ${name} is being paused`);
          },
        });
      }
    },
    [serviceId, name],
  );

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
    <div className="row min-w-0 max-w-full items-center gap-2">
      <ServiceTypeIcon type={service.type} size="big" />

      <div className="col min-w-0 gap-1">
        <div className="row items-center gap-2">
          <div className="typo-heading truncate">{service.name}</div>
          <CopyIconButton text={`${app.name}/${service.name}`} className="size-4" />
        </div>

        <div className="row gap-2 text-dim">
          <div className="whitespace-nowrap">
            <Translate id={`common.serviceType.${service.type}`} />
          </div>

          {url !== undefined && (
            <>
              <div className="border-l" />
              <ExternalLink openInNewTab href={`https://${url.externalUrl}`} className="text-link truncate">
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
      <Tab href={routes.service.overview(serviceId)}>
        <T id="navigation.overview" />
      </Tab>

      <Tab href={routes.service.metrics(serviceId)}>
        <T id="navigation.metrics" />
      </Tab>

      <Tab href={routes.service.console(serviceId)}>
        <T id="navigation.console" />
      </Tab>

      <Tab href={routes.service.settings(serviceId)}>
        <T id="navigation.settings" />
      </Tab>
    </TabButtons>
  );
}

function Tab(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return <TabButtonLink selected={pathname === props.href} className="whitespace-nowrap" {...props} />;
}

function ServicePausedAlert({ service }: { service: Service }) {
  const t = T.useTranslate();

  const { mutate: resume, isPending } = useMutation({
    ...useApiMutationFn('resumeService', {
      path: { id: service.id },
    }),
    onSuccess() {
      notify.info(t('servicePaused.resuming'));
    },
  });

  if (service.status !== 'paused') {
    return null;
  }

  return (
    <Alert
      variant="info"
      title={<T id="servicePaused.title" />}
      description={<T id="servicePaused.description" />}
    >
      <Button color="blue" loading={isPending} onClick={() => resume()} className="ml-auto self-center">
        <T id="servicePaused.resume" />
      </Button>
    </Alert>
  );
}
