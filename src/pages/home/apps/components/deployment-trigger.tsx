import { ComputeDeployment, type GitDeploymentTrigger } from 'src/api/model';
import { ExternalLink } from 'src/components/link';
import { IconGitBranch, IconGitCommitHorizontal } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { shortId } from 'src/utils/strings';

const T = createTranslate('pages.home.deploymentTrigger');

type DeploymentTriggerProps = {
  trigger: ComputeDeployment['trigger'];
};

export function DeploymentTrigger({ trigger }: DeploymentTriggerProps) {
  if (inArray(trigger?.type, ['initial', 'redeploy', 'resume'] as const)) {
    return (
      <span className="truncate text-xs text-dim">
        <T id={trigger.type} />
      </span>
    );
  }

  if (trigger?.type === 'git') {
    return <GitDeploymentTrigger trigger={trigger} />;
  }

  return null;
}

type GitDeploymentTriggerProps = {
  trigger: GitDeploymentTrigger;
};

function GitDeploymentTrigger({ trigger }: GitDeploymentTriggerProps) {
  const commit = trigger.commit.sha ? (
    <ExternalLink
      openInNewTab
      href={`https://${trigger.repository}/commit/${trigger.commit.sha}`}
      className="row min-w-0 items-center gap-2"
    >
      <span>
        <IconGitCommitHorizontal className="size-4" />
      </span>
      <span>#{shortId(trigger.commit.sha)}</span>
      <span className="truncate text-dim">{trigger.commit.message}</span>
    </ExternalLink>
  ) : undefined;

  const branch = (
    <ExternalLink
      openInNewTab
      href={`https://${trigger.repository}/tree/${trigger.branch}`}
      className="hidden items-center gap-2 sm:row"
    >
      <IconGitBranch className="size-4" />
      <span className="line-clamp-1">{trigger.branch}</span>
    </ExternalLink>
  );

  const by = (children: React.ReactNode) => <span className="text-dim">{children}</span>;

  const author = (
    <ExternalLink openInNewTab href={trigger.commit.author.url} className="row items-center gap-2">
      <img src={trigger.commit.author.avatar} className="size-4 rounded-full" />
      <span>{trigger.commit.author.name}</span>
    </ExternalLink>
  );

  return (
    <span className="row min-w-0 items-center gap-2 text-xs">
      <T id="git" values={{ commit, branch, by, author }} />
    </span>
  );
}
