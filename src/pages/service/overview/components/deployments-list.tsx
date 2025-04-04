import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { Badge, Button, Collapse, Tooltip } from '@koyeb/design-system';
import { ComputeDeployment, GitDeploymentTrigger, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { withStopPropagation } from 'src/application/dom-events';
import { notify } from 'src/application/notify';
import { isUpcomingDeployment } from 'src/application/service-functions';
import { IconChevronRight } from 'src/components/icons';
import { DeploymentStatusBadge } from 'src/components/status-badges';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';

import { DeploymentTrigger } from './deployment-trigger';

const T = createTranslate('pages.service.overview.deployments');

type DeploymentsListProps = {
  service: Service;
  totalDeployments: number;
  hasMoreDeployments: boolean;
  isLoadingMoreDeployments: boolean;
  loadMoreDeployments: () => void;
  selectedDeployment?: ComputeDeployment;
  activeDeployment?: ComputeDeployment;
  upcomingDeployments: ComputeDeployment[];
  upcomingExpanded: boolean;
  setUpcomingExpanded: (expanded: boolean) => void;
  pastDeployments: ComputeDeployment[];
  pastExpanded: boolean;
  setPastExpanded: (expanded: boolean) => void;
  onDeploymentSelected: (deployment: ComputeDeployment) => void;
};

export function DeploymentsList({
  service,
  totalDeployments,
  hasMoreDeployments,
  isLoadingMoreDeployments,
  loadMoreDeployments,
  selectedDeployment,
  activeDeployment: active,
  upcomingDeployments: upcoming,
  upcomingExpanded,
  setUpcomingExpanded,
  pastDeployments: past,
  pastExpanded,
  setPastExpanded,
  onDeploymentSelected,
}: DeploymentsListProps) {
  const pastCount = totalDeployments - (active ? 1 : 0) - upcoming.length;

  const isSelected = (deployment: ComputeDeployment) => {
    return selectedDeployment !== undefined && deployment.id === selectedDeployment.id;
  };

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
              <li key={deployment.id}>
                <DeploymentItem
                  service={service}
                  deployment={deployment}
                  selected={isSelected(deployment)}
                  onClick={() => onDeploymentSelected(deployment)}
                />
              </li>
            ))}
          </ol>
        </DeploymentsSection>
      )}

      <DeploymentsSection title={<T id="active.title" />} description={<T id="active.description" />}>
        {active && (
          <DeploymentItem
            service={service}
            deployment={active}
            selected={isSelected(active)}
            onClick={() => onDeploymentSelected(active)}
          />
        )}

        {!active && (
          <div className="col min-h-24 items-center justify-center rounded-md border border-dashed bg-muted/50 text-xs text-dim">
            <T id="active.noActiveDeployment" />
          </div>
        )}
      </DeploymentsSection>

      {past.length > 0 && (
        <DeploymentsSection
          title={<T id="past.title" />}
          count={pastCount}
          expanded={pastExpanded}
          onClick={() => setPastExpanded(!pastExpanded)}
        >
          <ol className="col gap-2">
            {past.map((deployment) => (
              <li key={deployment.id}>
                <DeploymentItem
                  service={service}
                  deployment={deployment}
                  selected={isSelected(deployment)}
                  onClick={() => onDeploymentSelected(deployment)}
                />
              </li>
            ))}

            {hasMoreDeployments && (
              <li>
                <Button
                  size={1}
                  color="gray"
                  className="w-full"
                  loading={isLoadingMoreDeployments}
                  onClick={loadMoreDeployments}
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
  deployment: ComputeDeployment;
  selected: boolean;
  onClick: () => void;
};

function DeploymentItem({ service, deployment, selected, onClick }: DeploymentItemProps) {
  const t = T.useTranslate();

  const active = deployment.id === service.activeDeploymentId;
  const upcoming = isUpcomingDeployment(deployment);

  const invalidate = useInvalidateApiQuery();

  const cancelMutation = useMutation({
    ...useApiMutationFn('cancelDeployment', {
      path: { id: deployment.id },
    }),
    async onSuccess() {
      await invalidate('listDeployments');
      notify.info(t('upcoming.cancelSuccess'));
    },
  });

  return (
    <div role="button" onClick={onClick} className={clsx('card shadow-none', selected && 'border-green')}>
      <div className={clsx('col gap-2 p-3', selected && 'bg-green/10')}>
        <div className="row items-center gap-1">
          <DeploymentStatusBadge status={deployment.status} />

          <Badge size={1} color="gray" className="!text-default">
            {deployment.name}
          </Badge>

          <FormattedDistanceToNow
            value={deployment.date}
            style="narrow"
            className="ml-auto text-xs font-medium text-dim"
          />

          {deployment.trigger?.type == 'git' && <TriggerCommitAuthor trigger={deployment.trigger} />}
        </div>

        <Tooltip content={<DeploymentTrigger deployment={deployment} />}>
          {(props) => (
            <div {...props} className="truncate text-xs text-dim">
              <DeploymentTrigger deployment={deployment} />
            </div>
          )}
        </Tooltip>
      </div>

      {active && (
        <footer
          className={clsx(
            '!justify-start gap-2 !px-3 !py-1',
            !selected && '!bg-green/10 !text-green',
            selected && '!bg-green text-white',
          )}
        >
          <span className={clsx('size-2.5 rounded-full', !selected && 'bg-green', selected && 'bg-white')} />
          <T id="active.activeDeployment" />
        </footer>
      )}

      {upcoming && (
        <footer className="p-2">
          <div className="text-xs text-dim">
            {deployment.status === 'PENDING' && <T id="upcoming.inQueue" />}
          </div>

          <Button
            variant="outline"
            color="gray"
            size={1}
            loading={cancelMutation.isPending}
            onClick={withStopPropagation(() => cancelMutation.mutate())}
            className="bg-neutral"
          >
            <T id="upcoming.cancel" />
          </Button>
        </footer>
      )}
    </div>
  );
}

function TriggerCommitAuthor({ trigger }: { trigger: GitDeploymentTrigger }) {
  return (
    <Tooltip content={trigger.commit.author.name}>
      {(props) => <img {...props} src={trigger.commit.author.avatar} className="size-5 rounded-full" />}
    </Tooltip>
  );
}
