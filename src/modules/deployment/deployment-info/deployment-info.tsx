import { useDeploymentScaling, useOrganization, useVolumes } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { ExternalLink, Link } from 'src/components/link';
import { Metadata } from 'src/components/metadata';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Tooltip } from 'src/components/tooltip';
import { IconDocker, IconGitBranch, IconGitCommitHorizontal, IconGithub } from 'src/icons';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, DeploymentDefinition, EnvironmentVariable, Service } from 'src/model';
import { ServiceFormSection } from 'src/modules/service-form';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { shortId } from 'src/utils/strings';

import { InstanceMetadata, RegionsMetadata, ScalingMetadata } from '../metadata';

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

  const organization = useOrganization();
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
          <div className="col gap-1">
            <InstanceMetadata instance={definition.instanceType} />
            {organization?.plan === 'hobby' ? (
              <MetadataUpgrade />
            ) : (
              <MetadataEdit service={service} section="instance" />
            )}
          </div>

          <div className="col gap-1">
            <ScalingMetadata replicas={replicas} sleeping={deployment.status === 'SLEEPING'} />
            <MetadataEdit service={service} section="scaling" />
          </div>

          <div className="col gap-1">
            <RegionsMetadata regions={definition.regions} />
            <MetadataEdit service={service} section="instance" />
          </div>

          <div className="col gap-1">
            <EnvironmentMetadata definition={definition} />
            <MetadataEdit service={service} section="environmentVariables" />
          </div>

          <div className="col gap-1">
            <VolumesMetadata definition={definition} />
            <MetadataEdit service={service} section="volumes" />
          </div>
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

function MetadataUpgrade() {
  return (
    <button className="text-link text-xs" onClick={() => openDialog('Upgrade', { plan: 'starter' })}>
      <Translate id="common.upgrade" />
    </button>
  );
}

function MetadataEdit({ service, section }: { service: Service; section: ServiceFormSection }) {
  return (
    <Link
      to="/services/$serviceId/settings"
      params={{ serviceId: service.id }}
      state={{ expandedSection: section }}
      className="text-link text-xs"
    >
      Configure
    </Link>
  );
}

export function DockerImageMetadata({ image }: { image: string }) {
  return (
    <Metadata
      label={<T id="dockerImageLabel" />}
      value={
        <div className="row items-center gap-2">
          <div>
            <IconDocker className="size-em" />
          </div>
          <div>{image}</div>
        </div>
      }
    />
  );
}

export function RepositoryMetadata({ repository }: { repository: string | null }) {
  return (
    <Metadata
      label={<T id="repositoryLabel" />}
      value={
        <div className="row items-center gap-2">
          <span>
            <IconGithub className="size-em" />
          </span>

          {repository === null && '-'}

          {repository !== null && (
            <ExternalLink openInNewTab href={`https://${repository}`}>
              {repository.replace(/^github.com\//, '')}
            </ExternalLink>
          )}
        </div>
      }
    />
  );
}

export function BranchMetadata({ repository, branch }: { repository: string | null; branch: string | null }) {
  return (
    <Metadata
      label={<T id="branchLabel" />}
      value={
        <div className="row items-center gap-2">
          <span>
            <IconGitBranch className="size-em" />
          </span>

          {repository !== null || (branch !== null && '-')}

          {repository !== null && branch !== null && (
            <ExternalLink openInNewTab href={`https://${repository}/tree/${branch}`}>
              {branch}
            </ExternalLink>
          )}
        </div>
      }
    />
  );
}

export function CommitMetadata({ deployment }: { deployment: ComputeDeployment }) {
  const source = deployment.definition.source;
  const sha = shortId(deployment.build?.sha);

  assert(source.type === 'git');

  if (sha === undefined) {
    return null;
  }

  return (
    <Metadata
      label={<T id="commitLabel" />}
      value={
        <div className="row items-center gap-2">
          <span>
            <IconGitCommitHorizontal className="size-em" />
          </span>

          <ExternalLink href={`https://${source.repository}/commit/${sha}`}>{sha}</ExternalLink>
        </div>
      }
    />
  );
}

export function BuilderMetadata({ builder }: { builder: DeploymentDefinition['builder'] }) {
  assert(builder !== undefined);

  return (
    <Metadata
      label={<T id="builderLabel" />}
      value={
        <div className="row items-center gap-2">
          <T id={builder.type} />
        </div>
      }
    />
  );
}

export function PrivilegedMetadata({ privileged }: { privileged?: boolean }) {
  assert(privileged !== undefined);

  return (
    <Metadata
      label={<T id="privilegedLabel" />}
      value={
        <div className="row items-center gap-2">
          <T id={String(privileged) as 'true' | 'false'} />
        </div>
      }
    />
  );
}

export function EnvironmentMetadata({ definition }: { definition: DeploymentDefinition }) {
  const { environmentVariables, files } = definition;

  const content = () => {
    if (environmentVariables.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {environmentVariables.map(formatEnvironmentVariable).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Metadata
      label={<T id="environmentLabel" />}
      value={
        <Tooltip
          allowHover
          content={content()}
          className="max-w-md"
          trigger={(props) => (
            <span {...props}>
              <T
                id="environmentValue"
                values={{ variables: environmentVariables.length, files: files.length }}
              />
            </span>
          )}
        />
      }
    />
  );
}

function formatEnvironmentVariable({ name, value }: EnvironmentVariable) {
  return `${name}=${value}`;
}

export function VolumesMetadata({ definition }: { definition: DeploymentDefinition }) {
  const { volumes: attachedVolumes } = definition;
  const volumes = useVolumes();

  const content = () => {
    if (attachedVolumes.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {attachedVolumes.map(({ volumeId, mountPath }) => (
          <div key={volumeId} className="truncate">
            <T
              id="attachedVolume"
              values={{
                volumeName: volumes?.find(hasProperty('id', volumeId))?.name,
                mountPath,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Metadata
      label={<T id="volumesLabel" />}
      value={
        <Tooltip
          allowHover
          content={content()}
          className="max-w-md"
          trigger={(props) => (
            <span {...props}>
              <T id="volumesValue" values={{ count: attachedVolumes.length }} />
            </span>
          )}
        />
      }
    />
  );
}
