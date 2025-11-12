import { ProgressBar } from '@koyeb/design-system';
import { FormattedDate, FormattedNumber } from 'react-intl';

import {
  isComputeDeployment,
  useAppQuery,
  useComputeDeployment,
  useDeploymentQuery,
  useInstancesQuery,
  useServiceQuery,
} from 'src/api';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { RuntimeLogs } from 'src/components/logs';
import { Metadata } from 'src/components/metadata';
import { QueryError, QueryGuard } from 'src/components/query-error';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { ServiceStatusBadge } from 'src/components/status-badges';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, Service } from 'src/model';
import { assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

import { useDeploymentMetric } from '../deployment/deployment-metrics/deployment-metrics';
import { InstanceMetadata, RegionsMetadata } from '../deployment/metadata';

const T = createTranslate('pages.sandbox.details');

export function SandboxDetails({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);

  return (
    <QueryGuard query={serviceQuery}>
      {(service) => (
        <>
          <div className="col gap-6 rounded-md border px-3 py-4">
            <div className="row items-start justify-between gap-4">
              <div className="col gap-2">
                <ServiceStatusBadge status={service.status} />

                <div className="row items-center gap-2">
                  {shortId(service.id)} <CopyIconButton text={service.id} className="size-4" />
                </div>
              </div>

              <div className="row items-center gap-2 font-medium">
                <TranslateEnum enum="serviceType" value="web" />
                <ServiceTypeIcon type="web" />
              </div>
            </div>

            <DeploymentMetadata deploymentId={service.latestDeploymentId} />
          </div>

          <SandboxLogs service={service} />
        </>
      )}
    </QueryGuard>
  );
}

function SandboxLogs({ service }: { service: Service }) {
  const appQuery = useAppQuery(service.appId);
  const deploymentQuery = useDeploymentQuery(service.latestDeploymentId);
  const instancesQuery = useInstancesQuery({ deploymentId: service.latestDeploymentId });

  if (appQuery.isPending || deploymentQuery.isPending || instancesQuery.isPending) {
    return null;
  }

  if (appQuery.isError) {
    return <QueryError error={appQuery.error} />;
  }

  if (deploymentQuery.isError) {
    return <QueryError error={deploymentQuery.error} />;
  }

  if (instancesQuery.isError) {
    return <QueryError error={instancesQuery.error} />;
  }

  const app = appQuery.data;
  const deployment = deploymentQuery.data;
  const { instances } = instancesQuery.data;

  assert(isComputeDeployment(deployment));

  return (
    <div className="rounded-md border">
      <RuntimeLogs app={app} service={service} deployment={deployment} instances={instances} />
    </div>
  );
}

function DeploymentMetadata({ deploymentId }: { deploymentId: string }) {
  const deployment = useComputeDeployment(deploymentId);

  if (!deployment) {
    return null;
  }

  return (
    <div className="row flex-wrap gap-3 rounded-xl bg-muted/50 p-3">
      <InstanceMetadata instance={deployment.definition.instanceType} className="w-44" />
      <MetricMetadata deployment={deployment} metric="cpu" />
      <MetricMetadata deployment={deployment} metric="memory" />
      <RegionsMetadata regions={deployment.definition.regions} className="w-44" />
      <DateMetadata date={deployment.date} />
    </div>
  );
}

function MetricMetadata({ deployment, metric }: { deployment: ComputeDeployment; metric: 'cpu' | 'memory' }) {
  const value = useDeploymentMetric(deployment, metric);

  if (value === undefined) {
    return null;
  }

  return (
    <Metadata
      label={<T id={`metadata.${metric}`} />}
      value={
        <div className="row items-center gap-2">
          <ProgressBar progress={value} label={false} className="max-w-16 flex-1" />
          <FormattedNumber value={value} style="percent" />
        </div>
      }
      className="w-44"
    />
  );
}

function DateMetadata({ date }: { date: string }) {
  return (
    <Metadata
      label={<T id="metadata.date" />}
      value={<FormattedDate value={date} dateStyle="medium" />}
      className="w-44"
    />
  );
}
