import { Alert, Button, TabButtons } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useAppQuery, useDeploymentQuery, useServiceQuery } from 'src/api/hooks/service';
import { App, Deployment, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { getServiceUrls } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { DocumentTitle } from 'src/components/document-title';
import { ExternalLink, TabButtonLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useNavigate, usePathname, useRouteParam } from 'src/hooks/router';
import { useServiceName } from 'src/hooks/service';
import { createTranslate, Translate } from 'src/intl/translate';
import { PaletteItem, useCommandPaletteContext } from 'src/modules/command-palette/command-palette.provider';
import { inArray } from 'src/utils/arrays';

import { DeploymentThrottledAlert } from './deployment-throttled-alert';
import { InstanceAvailabilityAlerts } from './instance-availability-alerts';
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

function RegisterServiceCommands({ service }: { service: Service }) {
  const { defaultItems, mutationEffects } = useCommandPaletteContext();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const invalidateService = useCallback(async () => {
    await invalidate('listServices');
    await invalidate('getService', { path: { id: service.id } });
  }, [invalidate, service.id]);

  const { mutate: redeploy } = useMutation({
    ...useApiMutationFn('redeployService', { path: { id: service.id }, body: {} }),
    ...mutationEffects,
    onSuccess: async () => {
      await invalidateService();
      notify.success(`Service ${service.name} is being redeployed`);
    },
  });

  const { mutate: resume } = useMutation({
    ...useApiMutationFn('resumeService', { path: { id: service.id } }),
    ...mutationEffects,
    onSuccess: async () => {
      await invalidateService();
      notify.success(`Service ${service.name} is being resumed`);
    },
  });

  const { mutate: pause } = useMutation({
    ...useApiMutationFn('pauseService', { path: { id: service.id } }),
    ...mutationEffects,
    onSuccess: async () => {
      await invalidateService();
      notify.success(`Service ${service.name} is being paused`);
    },
  });

  useEffect(() => {
    const name = service.name;

    const commands: PaletteItem[] = [
      {
        label: `Go to dashboard`,
        description: `Navigate to the ${name} service's dashboard page`,
        keywords: ['overview', 'dashboard', 'deployments', 'logs', 'build', 'runtime'],
        execute: () => navigate(routes.service.overview(service.id)),
      },

      {
        label: `Go to metrics`,
        description: `Navigate to the ${name} service's metrics page`,
        keywords: ['metrics', 'monitoring', 'graphs', 'charts'],
        execute: () => navigate(routes.service.metrics(service.id)),
      },

      {
        label: `Go to console`,
        description: `Navigate to the ${name} service's console page`,
        keywords: ['console', 'shell', 'terminal', 'command', 'execute', 'run', 'ssh'],
        execute: () => navigate(routes.service.console(service.id)),
      },

      {
        label: `Go to settings`,
        description: `Navigate to the ${name} service's settings page`,
        keywords: ['settings', 'update'],
        execute: () => navigate(routes.service.settings(service.id)),
      },

      {
        label: `Redeploy service`,
        description: `Redeploy ${name}'s latest deployment`,
        keywords: ['redeploy', 'restart'],
        weight: 4,
        execute: redeploy,
      },
    ];

    commands.forEach((command) => defaultItems.add(command));

    return () => {
      commands.forEach((command) => defaultItems.delete(command));
    };
  }, [defaultItems, navigate, service.id, service.name, redeploy]);

  useEffect(() => {
    const name = service.name;
    let command: PaletteItem | undefined = undefined;

    if (service.status === 'PAUSED') {
      command = {
        label: `Resume service ${name}`,
        description: `Resume ${name}`,
        keywords: ['resume', 'start'],
        weight: 4,
        execute: resume,
      };
    } else if (inArray(service.status, ['HEALTHY', 'DEGRADED'])) {
      command = {
        label: `Pause service ${name}`,
        description: `Pause ${name}`,
        keywords: ['pause', 'stop'],
        weight: 4,
        execute: pause,
      };
    }

    if (command !== undefined) {
      defaultItems.add(command);

      return () => {
        defaultItems.delete(command);
      };
    }
  }, [defaultItems, service.name, service.status, resume, pause]);

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
            <Translate id={`common.serviceType.${service.type}`} />
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

  if (service.status !== 'PAUSED') {
    return null;
  }

  return (
    <Alert
      variant="info"
      title={<T id="servicePaused.title" />}
      description={
        <T id={service.type === 'worker' ? 'servicePaused.descriptionWorker' : 'servicePaused.description'} />
      }
    >
      <Button color="blue" loading={isPending} onClick={() => resume()} className="ml-auto self-center">
        <T id="servicePaused.resume" />
      </Button>
    </Alert>
  );
}
