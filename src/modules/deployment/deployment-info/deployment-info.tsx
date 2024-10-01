import { useState } from 'react';

import { App, ComputeDeployment, Service } from 'src/api/model';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Translate } from 'src/intl/translate';

import {
  AutoDeployMetadata,
  BranchMetadata,
  BuilderMetadata,
  CommitMetadata,
  PrivilegedMetadata,
  RepositoryMetadata,
} from '../metadata/build-metadata';
import { DockerImageMetadata } from '../metadata/docker-metadata';
import {
  EnvironmentVariablesMetadata,
  InstanceTypeMetadata,
  RegionsMetadata,
  ScalingMetadata,
  VolumesMetadata,
} from '../metadata/runtime-metadata';

import { DeploymentDefinitionDialog } from './deployment-definition-dialog';
import { ExternalUrl } from './external-url';
import { InternalUrl } from './internal-url';

const T = Translate.prefix('deploymentInfo');

type DeploymentInfoProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function DeploymentInfo({ app, service, deployment }: DeploymentInfoProps) {
  const { definition } = deployment;
  const { type, source, builder, privileged } = definition;

  const [definitionDialogOpen, setDefinitionDialogOpen] = useState(false);

  return (
    <section className="rounded-md border">
      <header className="col gap-3 p-3">
        <div className="row items-center gap-4">
          <div className="text-base font-medium">
            <T id="overview" />
          </div>

          <div className="row ml-auto items-center gap-2 font-medium">
            <Translate id={`common.serviceType.${type}`} />
            <ServiceTypeIcon type={type} size="medium" />
          </div>
        </div>

        {type !== 'worker' && (
          <div className="row flex-wrap gap-x-16 gap-y-4">
            <ExternalUrl app={app} service={service} deployment={deployment} />
            <InternalUrl app={app} service={service} deployment={deployment} />
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
              {source.type === 'git' && <AutoDeployMetadata autoDeploy={source.autoDeploy} />}
              <PrivilegedMetadata privileged={privileged} />
            </>
          )}

          {source.type === 'docker' && <DockerImageMetadata image={source.image} />}
        </div>

        <div className="row flex-wrap gap-6 p-3">
          <InstanceTypeMetadata instanceType={definition.instanceType} />
          <ScalingMetadata scaling={definition.scaling} />
          <RegionsMetadata regions={definition.regions} />
          <EnvironmentVariablesMetadata definition={definition} />
          <VolumesMetadata definition={definition} />
        </div>
      </div>

      <div className="row mb-4 justify-center">
        <button className="text-link" onClick={() => setDefinitionDialogOpen(true)}>
          <T id="viewMore" />
        </button>
      </div>

      <DeploymentDefinitionDialog
        open={definitionDialogOpen}
        onClose={() => setDefinitionDialogOpen(false)}
        deployment={deployment}
      />
    </section>
  );
}
