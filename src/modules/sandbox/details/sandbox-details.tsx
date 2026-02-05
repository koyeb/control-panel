import { ProgressBar } from '@koyeb/design-system';
import { FormattedDate, FormattedNumber } from 'react-intl';

import {
  isComputeDeployment,
  useAppQuery,
  useComputeDeployment,
  useDeploymentQuery,
  useInstancesQuery,
} from 'src/api';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { openDialog } from 'src/components/dialog';
import { RuntimeLogs } from 'src/components/logs';
import { Metadata } from 'src/components/metadata';
import { QueryError } from 'src/components/query-error';
import { ServiceLifecycleInfo } from 'src/components/service-lifecycle-info';
import { ServiceStatusBadge } from 'src/components/status-badges';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { IconDocker } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, DeploymentDefinition, Service } from 'src/model';
import { DeploymentDefinitionDialog } from 'src/modules/deployment/deployment-definition-dialog/deployment-definition-dialog';
import { assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

import { useDeploymentMetric } from '../../deployment/deployment-metrics/deployment-metrics';
import { InstanceMetadata, RegionsMetadata } from '../../deployment/metadata';

const T = createTranslate('pages.sandbox.details');

export function SandboxDetails({ service }: { service: Service }) {
  return (
    <>
      <DeploymentDefinitionDialog />
      <SandboxMetadata service={service} />
      <SandboxLogs service={service} />
    </>
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

function SandboxMetadata({ service }: { service: Service }) {
  const deployment = useComputeDeployment(service.latestDeploymentId);
  if (!deployment) {
    return null;
  }

  const { source, instanceType, regions } = deployment.definition;

  return (
    <div className="rounded-md border">
      <FeatureFlag feature="service-lifecycle">
        <ServiceLifecycleInfo service={service} />
      </FeatureFlag>

      <div className="row flex-wrap gap-3 p-3">
        <Metadata label={<T id="metadata.id" />} value={<ServiceId service={service} />} className="w-44" />

        <Metadata
          label={<T id="metadata.status" />}
          value={<ServiceStatusBadge status={service.status} />}
          className="w-44"
        />

        <InstanceMetadata instance={instanceType} className="w-44" />

        <RegionsMetadata regions={regions} className="w-44" />
      </div>

      <div className="row flex-wrap gap-3 p-3">
        <MetricMetadata deployment={deployment} metric="cpu" />

        <MetricMetadata deployment={deployment} metric="memory" />

        <Metadata
          label={<T id="metadata.dockerImage" />}
          value={<DockerImage source={source} />}
          className="w-44"
        />

        <DateMetadata date={deployment.date} />
      </div>

      <div>
        <button
          type="button"
          className="mx-auto my-2 block text-link py-1"
          onClick={() => openDialog('DeploymentDefinition', deployment)}
        >
          <T id="more" />
        </button>
      </div>
    </div>
  );
}

function ServiceId({ service }: { service: Service }) {
  return (
    <div className="row items-center gap-2">
      {shortId(service.id)} <CopyIconButton text={service.id} className="size-4" />
    </div>
  );
}

function DockerImage({ source }: { source: DeploymentDefinition['source'] }) {
  return (
    <div className="row items-center gap-2">
      <div>
        <IconDocker className="size-4" />
      </div>
      <div className="truncate">{source.type === 'docker' && source.image}</div>
    </div>
  );
}

function MetricMetadata({ deployment, metric }: { deployment: ComputeDeployment; metric: 'cpu' | 'memory' }) {
  const value = useDeploymentMetric(deployment, metric);

  return (
    <Metadata
      label={<T id={`metadata.${metric}`} />}
      value={
        value !== undefined ? (
          <div className="row items-center gap-2">
            <ProgressBar progress={value} className="max-w-16 flex-1" />
            <FormattedNumber value={value} style="percent" />
          </div>
        ) : (
          <Translate id="common.noValue" />
        )
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
