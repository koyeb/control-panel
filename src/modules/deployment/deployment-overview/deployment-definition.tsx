import { Spinner } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';

import { apiQuery, useDeploymentScaling, useOrganization } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { ExternalLink, Link } from 'src/components/link';
import { Metadata } from 'src/components/metadata';
import { Tooltip } from 'src/components/tooltip';
import { IconDocker, IconGitBranch, IconGitCommitHorizontal, IconGithub } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, type DeploymentDefinition, EnvironmentVariable, Service } from 'src/model';
import { ServiceFormSection } from 'src/modules/service-form';
import { assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

import { DeploymentDefinitionDialog } from '../deployment-definition-dialog/deployment-definition-dialog';
import { InstanceMetadata, RegionsMetadata, ScalingMetadata } from '../metadata';

const T = createTranslate('modules.deployment.deploymentDefinition');

type DeploymentDefinitionProps = {
  service: Service;
  deployment: ComputeDeployment;
};

export function DeploymentDefinition({ service, deployment }: DeploymentDefinitionProps) {
  const { definition } = deployment;
  const { source, builder, privileged } = definition;

  const organization = useOrganization();
  const replicas = useDeploymentScaling(deployment);

  return (
    <section className="rounded-md border">
      <div className="row flex-wrap gap-6 border-b p-3">
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

      <div className="row flex-wrap gap-6 border-b p-3">
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

      <div className="row justify-center p-3">
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
      <Translate id="common.configure" />
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

  const content = () => {
    if (attachedVolumes.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {attachedVolumes.map(({ volumeId, mountPath }) => (
          <AttachedVolume key={volumeId} volumeId={volumeId} mountPath={mountPath} />
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

function AttachedVolume({ volumeId, mountPath }: { volumeId: string; mountPath: string }) {
  const query = useQuery({
    ...apiQuery('get /v1/volumes/{id}', { path: { id: volumeId } }),
    select: ({ volume }) => volume!.name,
  });

  return (
    <div key={volumeId} className="truncate">
      <T
        id="attachedVolume"
        values={{ volumeName: query.data ?? <Spinner className="size-em" />, mountPath }}
      />
    </div>
  );
}
