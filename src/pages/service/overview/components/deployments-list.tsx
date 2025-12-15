import { Badge, Button, Collapse } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useEffectEvent, useState } from 'react';

import { apiMutation, isComputeDeployment, useDeploymentsQuery, useInvalidateApiQuery } from 'src/api';
import { withPreventDefault } from 'src/application/dom-events';
import { notify } from 'src/application/notify';
import { allApiDeploymentStatuses, isUpcomingDeployment } from 'src/application/service-functions';
import { Link } from 'src/components/link';
import { DeploymentStatusBadge } from 'src/components/status-badges';
import { IconChevronRight } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { Deployment, Service } from 'src/model';
import { exclude } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { DeploymentTrigger } from './deployment-trigger';

const T = createTranslate('pages.service.overview.deployments');

type DeploymentsListProps = {
  service: Service;
  selected?: Deployment;
  active?: Deployment;
  upcoming: Deployment[];
  history: Deployment[];
  setListExpanded: (expanded: boolean) => void;
  onSelected: () => void;
};

export function DeploymentsList({
  service,
  selected,
  active,
  upcoming,
  history,
  setListExpanded,
  onSelected,
}: DeploymentsListProps) {
  const deploymentsQuery = useDeploymentsQuery(service.id, exclude(allApiDeploymentStatuses, 'STASHED'));
  const { data: { count: deploymentsCount = 0 } = {} } = deploymentsQuery;

  const [upcomingExpanded, setUpcomingExpanded] = useState(upcoming.length > 0);
  const [historyExpanded, setHistoryExpanded] = useState(history.some(hasProperty('id', selected?.id)));

  useAutoExpand({ selected, setListExpanded, upcoming, setUpcomingExpanded, history, setHistoryExpanded });

  const deploymentItem = (deployment: Deployment) => (
    <DeploymentItem
      service={service}
      deployment={deployment}
      isSelected={deployment.id === selected?.id}
      onSelected={onSelected}
    />
  );

  return (
    <div className="col w-full gap-6 md:w-72">
      {upcoming.length > 0 && (
        <DeploymentsSection
          title={<T id="upcoming.title" />}
          count={upcoming.length}
          expanded={upcomingExpanded}
          onClick={() => setUpcomingExpanded(!upcomingExpanded)}
        >
          <ol className="col gap-2">
            {upcoming.map((deployment) => (
              <li key={deployment.id}>{deploymentItem(deployment)}</li>
            ))}
          </ol>
        </DeploymentsSection>
      )}

      <DeploymentsSection title={<T id="active.title" />} description={<T id="active.description" />}>
        {active && deploymentItem(active)}

        {!active && (
          <div className="col min-h-24 items-center justify-center rounded-md border border-dashed bg-muted/50 text-xs text-dim">
            <T id="active.noActiveDeployment" />
          </div>
        )}
      </DeploymentsSection>

      {history.length > 0 && (
        <DeploymentsSection
          title={<T id="past.title" />}
          count={deploymentsCount - (active ? 1 : 0) - upcoming.length}
          expanded={historyExpanded}
          onClick={() => setHistoryExpanded(!historyExpanded)}
        >
          <ol className="col gap-2">
            {history.map((deployment) => (
              <li key={deployment.id}>{deploymentItem(deployment)}</li>
            ))}

            {deploymentsQuery.hasNextPage && (
              <li>
                <Button
                  size={1}
                  color="gray"
                  className="w-full"
                  loading={deploymentsQuery.isLoading}
                  onClick={() => void deploymentsQuery.fetchNextPage()}
                >
                  <T id="loadMore" />
                </Button>
              </li>
            )}
          </ol>
        </DeploymentsSection>
      )}
    </div>
  );
}

type DeploymentsSectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  count?: number;
  expanded?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

function DeploymentsSection({
  title,
  count,
  description,
  expanded,
  onClick,
  children,
}: DeploymentsSectionProps) {
  return (
    <div>
      <div className="col items-start gap-1">
        <div
          role={expanded !== undefined ? 'button' : undefined}
          className="row w-full items-center gap-1"
          onClick={onClick}
        >
          {expanded !== undefined && (
            <IconChevronRight className={clsx('size-4 transition-transform', expanded && 'rotate-90')} />
          )}

          <div className="font-medium">{title}</div>

          {count !== undefined && (
            <div className="ml-auto text-xs text-dim">{count < 100 ? count : <T id="+99" />}</div>
          )}
        </div>

        {description && <div className="text-xs text-dim">{description}</div>}
      </div>

      <Collapse open={expanded ?? true}>
        <div className="mt-3">{children}</div>
      </Collapse>
    </div>
  );
}

type DeploymentItemProps = {
  service: Service;
  deployment: Deployment;
  isSelected: boolean;
  onSelected: () => void;
};

function DeploymentItem({ service, deployment, isSelected, onSelected }: DeploymentItemProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const isActive = deployment.id === service.activeDeploymentId;
  const isUpcoming = isUpcomingDeployment(deployment);

  const cancelMutation = useMutation({
    ...apiMutation('post /v1/deployments/{id}/cancel', {
      path: { id: deployment.id },
    }),
    async onSuccess() {
      await invalidate('get /v1/deployments');
      notify.info(t('upcoming.cancelSuccess'));
    },
  });

  assert(isComputeDeployment(deployment));

  return (
    <Link
      to="/services/$serviceId"
      params={{ serviceId: service.id }}
      search={(prev) => ({ ...prev, deploymentId: deployment.id })}
      role="button"
      onClick={onSelected}
      className={clsx('card block shadow-none', isSelected && 'border-green')}
    >
      <div className={clsx('col gap-2 p-3', isSelected && 'bg-green/10')}>
        <div className="row items-center gap-1">
          <DeploymentStatusBadge status={deployment.status} />

          <Badge size={1} color="gray" className="text-default!">
            {deployment.name}
          </Badge>

          <FormattedDistanceToNow
            value={deployment.date}
            style="narrow"
            className="ml-auto text-xs font-medium text-dim"
          />

          {deployment.trigger?.type == 'git' && (
            <img
              src={deployment.trigger.commit.author.avatar}
              className="size-5 rounded-full"
              title={deployment.trigger.commit.author.name}
            />
          )}
        </div>

        <div className="truncate text-xs text-dim">
          <DeploymentTrigger deployment={deployment} />
        </div>
      </div>

      {isActive && (
        <footer
          className={clsx(
            'justify-start! gap-2 px-3! py-1!',
            !isSelected && 'bg-green/10! text-green!',
            isSelected && 'bg-green! text-white',
          )}
        >
          <span
            className={clsx('size-2.5 rounded-full', !isSelected && 'bg-green', isSelected && 'bg-white')}
          />
          <T id="active.activeDeployment" />
        </footer>
      )}

      {isUpcoming && (
        <footer className="p-2">
          <div className="text-xs text-dim">
            {deployment.status === 'PENDING' && <T id="upcoming.inQueue" />}
          </div>

          <Button
            variant="outline"
            color="gray"
            size={1}
            loading={cancelMutation.isPending}
            onClick={withPreventDefault(() => cancelMutation.mutate())}
            className="bg-neutral"
          >
            <T id="upcoming.cancel" />
          </Button>
        </footer>
      )}
    </Link>
  );
}

function useAutoExpand(props: {
  selected?: Deployment;
  setListExpanded: (expanded: boolean) => void;
  upcoming: Deployment[];
  setUpcomingExpanded: (expanded: boolean) => void;
  history: Deployment[];
  setHistoryExpanded: (expanded: boolean) => void;
}) {
  const { selected, setListExpanded, upcoming, setUpcomingExpanded, history, setHistoryExpanded } = props;

  const expandUpcoming = useEffectEvent(() => {
    setListExpanded(true);
    setUpcomingExpanded(true);
  });

  useEffect(() => {
    if (upcoming.length > 0) {
      expandUpcoming();
    }
  }, [upcoming.length]);

  const expandHistory = useEffectEvent(() => {
    setListExpanded(true);
    setHistoryExpanded(true);
  });

  useEffect(() => {
    if (history.some(hasProperty('id', selected?.id))) {
      expandHistory();
    }
  }, [history, selected]);
}
