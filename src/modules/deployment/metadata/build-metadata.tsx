import IconGitBranch from 'lucide-static/icons/git-branch.svg?react';
import IconGitCommitHorizontal from 'lucide-static/icons/git-commit-horizontal.svg?react';
import IconGithub from 'lucide-static/icons/github.svg?react';

import { ComputeDeployment, DeploymentDefinition } from 'src/api/model';
import { ExternalLink } from 'src/components/link';
import { Metadata } from 'src/components/metadata';
import { TextSkeleton } from 'src/components/skeleton';
import { Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { shortId } from 'src/utils/strings';

const T = Translate.prefix('deploymentInfo');

export function RepositoryMetadata({ repository }: { repository: string }) {
  return (
    <Metadata
      label={<T id="repositoryLabel" />}
      value={
        <div className="row items-center gap-2">
          <span>
            <IconGithub className="size-em" />
          </span>

          <ExternalLink href={`https://${repository}`}>
            {repository.replace(/^github.com\//, '')}
          </ExternalLink>
        </div>
      }
    />
  );
}

export function BranchMetadata({ repository, branch }: { repository: string; branch: string }) {
  return (
    <Metadata
      label={<T id="branchLabel" />}
      value={
        <div className="row items-center gap-2">
          <span>
            <IconGitBranch className="size-em" />
          </span>

          <ExternalLink href={`https://${repository}/tree/${branch}`}>{branch}</ExternalLink>
        </div>
      }
    />
  );
}

export function CommitMetadata({ deployment }: { deployment: ComputeDeployment }) {
  const source = deployment.definition.source;
  const sha = shortId(deployment.build?.sha);

  assert(source.type === 'git');

  return (
    <Metadata
      label={<T id="commitLabel" />}
      value={
        <div className="row items-center gap-2">
          <span>
            <IconGitCommitHorizontal className="size-em" />
          </span>

          {!sha && <TextSkeleton width={4} />}
          {sha && <ExternalLink href={`https://${source.repository}/commits/${sha}`}>{sha}</ExternalLink>}
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

export function AutoDeployMetadata({ autoDeploy }: { autoDeploy?: boolean }) {
  assert(autoDeploy !== undefined);

  return (
    <Metadata
      label={<T id="autoDeployLabel" />}
      value={
        <div className="row items-center gap-2">
          <T id={String(autoDeploy) as 'true' | 'false'} />
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
