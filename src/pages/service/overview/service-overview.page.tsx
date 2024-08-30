import clsx from 'clsx';
import IconChevronLeft from 'lucide-static/icons/chevron-left.svg?react';
import IconChevronsLeft from 'lucide-static/icons/chevrons-left.svg?react';

import { Alert, IconButton, Tooltip, useBreakpoint } from '@koyeb/design-system';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { DeploymentFailedInfo } from 'src/modules/deployment/deployment-failed-info/deployment-failed-info';
import { DeploymentInfo } from 'src/modules/deployment/deployment-info/deployment-info';
import { DeploymentLogs } from 'src/modules/deployment/deployment-logs/deployment-logs';
import { assert } from 'src/utils/assert';

import { DeploymentHeader } from './components/deployment-header';
import { DeploymentsList } from './components/deployments-list';
import { useServiceOverview, type ServiceOverview } from './service-overview';

const T = Translate.prefix('pages.service.overview');

export function ServiceOverviewPage() {
  const serviceId = useRouteParam('serviceId');
  const props = useServiceOverview(serviceId);

  return <ServiceOverview {...props} />;
}

function ServiceOverview(props: ServiceOverview) {
  const { deploymentsQuery, listExpanded, selectedDeployment } = props;
  const isMobile = !useBreakpoint('md');

  if (deploymentsQuery.isPending) {
    return <Loading />;
  }

  if (deploymentsQuery.error) {
    return <QueryError error={deploymentsQuery.error} />;
  }

  if (isMobile) {
    return (
      <>
        {listExpanded && <DeploymentsList {...props} />}
        {!listExpanded && selectedDeployment && <SelectedDeployment {...props} />}
      </>
    );
  }

  return (
    <div className="row">
      <div
        // eslint-disable-next-line tailwindcss/no-arbitrary-value
        className="row overflow-hidden transition-[max-width] will-change-[max-width]"
        style={{ maxWidth: listExpanded ? 600 : 0 }}
      >
        <DeploymentsList {...props} />
        <div className="mx-8 border-l" />
      </div>

      {selectedDeployment && <SelectedDeployment {...props} />}
    </div>
  );
}

function SelectedDeployment({ className, ...props }: ServiceOverview & { className?: string }) {
  const { app, service, instances, selectedDeployment } = props;

  assert(selectedDeployment !== undefined);

  return (
    <section className="col min-w-0 flex-1 gap-8">
      <div className="col gap-4">
        <DeploymentsListActions {...props} />
        <DeploymentHeader deployment={selectedDeployment} />
      </div>

      <DeploymentFailedInfo deployment={selectedDeployment} layout="row" />
      <DeploymentInfo app={app} service={service} deployment={selectedDeployment} />

      {selectedDeployment.status === 'stashed' && <DeploymentStashed />}
      {selectedDeployment.status !== 'stashed' && (
        <DeploymentLogs app={app} service={service} instances={instances} deployment={selectedDeployment} />
      )}
    </section>
  );
}

function DeploymentsListActions({
  service,
  listExpanded,
  setListExpanded,
  upcomingDeployments,
  selectedDeployment,
}: ServiceOverview) {
  const { activeDeploymentId, latestDeploymentId } = service;
  const hasUpcoming = upcomingDeployments.length > 0;

  const isActive = () => {
    return selectedDeployment?.id === activeDeploymentId;
  };

  const isLatest = () => {
    return selectedDeployment?.id === latestDeploymentId;
  };

  return (
    <div className="row items-center md:divide-x">
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
            !listExpanded && hasUpcoming && 'after:ping after:absolute after:right-1 after:top-1',
          )}
        />
      </div>

      <Tooltip
        content={activeDeploymentId === undefined && <T id="deployments.actions.noActiveDeployment" />}
      >
        {(props) => (
          <div {...props} className="md:px-2">
            <LinkButton
              variant="ghost"
              color="gray"
              size={1}
              disabled={isActive() || activeDeploymentId === undefined}
              href={routes.service.overview(service.id, activeDeploymentId)}
            >
              <T id="deployments.actions.activeDeployment" />
            </LinkButton>
          </div>
        )}
      </Tooltip>

      <div className="md:ps-2">
        <LinkButton
          variant="ghost"
          color="gray"
          size={1}
          disabled={isLatest()}
          href={routes.service.overview(service.id, latestDeploymentId)}
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
