import { useDeploymentScaling } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Service } from 'src/model';

import { InstanceMetadata, RegionsMetadata, ScalingMetadata } from '../metadata';
import {
  BranchMetadata,
  BuilderMetadata,
  CommitMetadata,
  PrivilegedMetadata,
  RepositoryMetadata,
} from '../metadata/build-metadata';
import { DockerImageMetadata } from '../metadata/docker-metadata';
import { EnvironmentMetadata, VolumesMetadata } from '../metadata/runtime-metadata';

import { DeploymentDefinitionDialog } from './deployment-definition-dialog';
import { ExternalUrl } from './external-url';
import { InternalUrl } from './internal-url';
import { TcpProxyUrl } from './tcp-proxy-url';

const T = createTranslate('modules.deployment.deploymentInfo');

type DeploymentInfoProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function DeploymentInfo({ app, service, deployment }: DeploymentInfoProps) {
  const { definition } = deployment;
  const { type, source, builder, privileged } = definition;

  const replicas = useDeploymentScaling(deployment.id);

  return (
    <section className="rounded-md border">
      <header className="col gap-3 p-3">
        <div className="row items-center gap-4">
          <div className="text-base font-medium">
            <T id="overview" />
          </div>

          <div className="ml-auto row items-center gap-2 font-medium">
            <TranslateEnum enum="serviceType" value={type} />
            <ServiceTypeIcon type={type} />
          </div>
        </div>

        {type !== 'worker' && (
          <div className="row flex-wrap gap-x-16 gap-y-4">
            <ExternalUrl app={app} service={service} deployment={deployment} />
            <InternalUrl app={app} service={service} deployment={deployment} />
            <TcpProxyUrl app={app} service={service} deployment={deployment} />
          </div>
        )}
      </header>

      <div className="m-3 divide-y rounded-md border">
        <div className="row flex-wrap gap-6 p-3">
          {source.type === 'git' && (
            <>
              <RepositoryMetadata repository={source.repository} />
              <BranchMetadata repository={source.repository} branch={source.branch} />
              <CommitMetadata deployment={deployment} />
            </>
          )}

          {(source.type === 'git' || source.type === 'archive') && (
            <>
              <BuilderMetadata builder={builder} />
              <PrivilegedMetadata privileged={privileged} />
            </>
          )}

          {source.type === 'docker' && <DockerImageMetadata image={source.image} />}
        </div>

        <div className="row flex-wrap gap-6 p-3">
          <InstanceMetadata instance={definition.instanceType} />
          <ScalingMetadata definition={definition} replicas={replicas} />
          <RegionsMetadata regions={definition.regions} />
          <EnvironmentMetadata definition={definition} />
          <VolumesMetadata definition={definition} />
        </div>
      </div>

      <div className="mb-4 row justify-center">
        <button className="text-link" onClick={() => openDialog('DeploymentDefinition', deployment)}>
          <T id="viewMore" />
        </button>
      </div>

      <DeploymentDefinitionDialog />
    </section>
  );
}
