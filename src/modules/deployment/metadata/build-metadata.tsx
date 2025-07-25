import { ComputeDeployment, DeploymentDefinition } from 'src/api/model';
import { ExternalLink } from 'src/components/link';
import { Metadata } from 'src/components/metadata';
import { IconGitBranch, IconGitCommitHorizontal, IconGithub } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

const T = createTranslate('modules.deployment.deploymentInfo');

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
