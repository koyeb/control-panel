import { Alert, IconButton, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useMemo, useState } from 'react';

import {
  isComputeDeployment,
  useAppQuery,
  useDeploymentQuery,
  useDeploymentsQuery,
  useServiceQuery,
} from 'src/api';
import { allApiDeploymentStatuses, isUpcomingDeployment } from 'src/application/service-functions';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { Tooltip } from 'src/components/tooltip';
import { IconChevronLeft, IconChevronsLeft } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { App, Deployment, Service } from 'src/model';
import {
  useCreateServiceUrlsCommands,
  useDeploymentListCommand,
} from 'src/modules/command-palette/commands/service';
import { DeploymentFailedInfo } from 'src/modules/deployment/deployment-failed-info/deployment-failed-info';
import { DeploymentLogs } from 'src/modules/deployment/deployment-logs/deployment-logs';
import { DeploymentOverview } from 'src/modules/deployment/deployment-overview/deployment-overview';
import { exclude } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { DeploymentHeader } from './components/deployment-header';
import { DeploymentsList } from './components/deployments-list';

const T = createTranslate('pages.service.overview');

type ServiceOverviewPageProps = {
  serviceId: string;
  deploymentId?: string;
};

export function ServiceOverviewPage({ serviceId, deploymentId }: ServiceOverviewPageProps) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);
  const deploymentsQuery = useDeploymentsQuery(serviceId, exclude(allApiDeploymentStatuses, 'STASHED'));
  const selectedDeploymentsQuery = useDeploymentQuery(deploymentId);

  if (
    appQuery.isPending ||
    serviceQuery.isPending ||
    deploymentsQuery.isPending ||
    selectedDeploymentsQuery.isPending
  ) {
    return <Loading />;
  }

  if (appQuery.error) {
    return <QueryError error={appQuery.error} />;
  }

  if (serviceQuery.error) {
    return <QueryError error={serviceQuery.error} />;
  }

  if (deploymentsQuery.error) {
    return <QueryError error={deploymentsQuery.error} />;
  }

  if (selectedDeploymentsQuery.error) {
    return <QueryError error={selectedDeploymentsQuery.error} />;
  }

  return (
    <ServiceOverview
      app={appQuery.data}
      service={serviceQuery.data}
      deployments={deploymentsQuery.data.deployments}
      selectedDeployment={selectedDeploymentsQuery.data}
    />
  );
}

type ServiceOverviewProps = {
  app: App;
  service: Service;
  deployments: Deployment[];
  selectedDeployment?: Deployment;
};

function ServiceOverview({ app, service, deployments, selectedDeployment }: ServiceOverviewProps) {
  const [mobileView, setMobileView] = useState<'list' | 'details'>('details');
  const isMobile = !useBreakpoint('md');

  const [upcoming, active, history] = useDeploymentsGroups(service, deployments);

  const [listExpanded, setListExpanded] = useState(
    upcoming.length > 0 || history.some(hasProperty('id', selectedDeployment?.id)),
  );

  useCreateServiceUrlsCommands(app, service, selectedDeployment);
  useDeploymentListCommand(service);

  const list = (
    <DeploymentsList
      service={service}
      selected={selectedDeployment}
      active={active}
      upcoming={upcoming}
      history={history}
      setListExpanded={setListExpanded}
      onSelected={() => setMobileView('details')}
    />
  );

  const content = selectedDeployment && (
    <div className="min-w-0 flex-1">
      <DeploymentsListActions
        service={service}
        deployments={deployments}
        selectedDeployment={selectedDeployment}
        listExpanded={listExpanded}
        setListExpanded={(expanded) => {
          setListExpanded(expanded);
          setMobileView(expanded ? 'details' : 'list');
        }}
      />

      <SelectedDeployment app={app} service={service} deployment={selectedDeployment} />
    </div>
  );

  if (isMobile) {
    return mobileView === 'list' ? list : content;
  }

  return (
    <div className="row">
      <div
        className={clsx(
          'row overflow-hidden transition-all ease-out will-change-[max-width]',
          listExpanded ? 'max-w-[600px] opacity-100' : 'max-w-0 opacity-0',
        )}
      >
        <div className="w-full">{list}</div>
        <div className="mx-8 border-l" />
      </div>

      {content}
    </div>
  );
}

function useDeploymentsGroups(service: Service, deployments: Deployment[]) {
  return useMemo(() => {
    let active: Deployment | undefined = undefined;
    const upcoming: Deployment[] = [];
    const past: Deployment[] = [];

    for (const deployment of deployments) {
      if (deployment.id === service.activeDeploymentId) {
        active = deployment;
      } else if (isUpcomingDeployment(deployment)) {
        upcoming.push(deployment);
      } else {
        past.push(deployment);
      }
    }

    return [upcoming, active, past] as const;
  }, [service, deployments]);
}

type SelectedDeploymentProps = {
  app: App;
  service: Service;
  deployment: Deployment;
};

function SelectedDeployment({ app, service, deployment }: SelectedDeploymentProps) {
  assert(isComputeDeployment(deployment));

  return (
    <div className="col gap-8">
      <DeploymentHeader deployment={deployment} />

      <DeploymentFailedInfo deployment={deployment} layout="row" />
      <DeploymentOverview app={app} service={service} deployment={deployment} />

      {deployment.status === 'STASHED' && <DeploymentStashed />}
      {deployment.status !== 'STASHED' && (
        <DeploymentLogs app={app} service={service} deployment={deployment} />
      )}
    </div>
  );
}

type DeploymentsListActionsProps = {
  service: Service;
  deployments: Deployment[];
  selectedDeployment?: Deployment;
  listExpanded: boolean;
  setListExpanded: (expanded: boolean) => void;
};

function DeploymentsListActions({
  service,
  deployments,
  selectedDeployment,
  listExpanded,
  setListExpanded,
}: DeploymentsListActionsProps) {
  const { id: serviceId, activeDeploymentId } = service;
  const latestDeploymentId = deployments[0]?.id;
  const hasUpcoming = deployments.filter(isUpcomingDeployment).length > 0;

  return (
    <div className="mb-4 row items-center md:divide-x">
      <div className="md:pe-2">
        <IconButton
          icon={
            <>
              <IconChevronLeft className="size-4 md:hidden" />
              <IconChevronsLeft className={clsx('hidden size-4 md:block', !listExpanded && '-scale-x-100')} />
            </>
          }
          variant="ghost"
          color="gray"
          size={1}
          onClick={() => setListExpanded(!listExpanded)}
          className={clsx(
            'relative',
            !listExpanded && hasUpcoming && 'after:absolute after:top-1 after:right-1 after:ping',
          )}
        />
      </div>

      <Tooltip
        trigger={(props) => (
          <div {...props} className="md:px-2">
            <LinkButton
              variant="ghost"
              color="gray"
              size={1}
              disabled={selectedDeployment?.id === activeDeploymentId || activeDeploymentId === undefined}
              to="/services/$serviceId"
              params={{ serviceId }}
              search={{ deploymentId: activeDeploymentId }}
            >
              <T id="deployments.actions.activeDeployment" />
            </LinkButton>
          </div>
        )}
        content={
          service.activeDeploymentId === undefined && <T id="deployments.actions.noActiveDeployment" />
        }
      />

      <div className="md:ps-2">
        <LinkButton
          variant="ghost"
          color="gray"
          size={1}
          disabled={selectedDeployment?.id === latestDeploymentId}
          to="/services/$serviceId"
          params={{ serviceId }}
          search={{ deploymentId: latestDeploymentId }}
        >
          <T id="deployments.actions.latestDeployment" />
        </LinkButton>
      </div>
    </div>
  );
}

function DeploymentStashed() {
  return (
    <Alert
      variant="info"
      title={<T id="deploymentStashedAlert.title" />}
      description={<T id="deploymentStashedAlert.description" />}
    />
  );
}
