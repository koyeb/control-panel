import '@koyeb/design-system';

import { CopyIconButton } from 'src/components/copy-icon-button';
import { DeploymentStatusBadge } from 'src/components/status-badges';
import { Tooltip } from 'src/components/tooltip';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { ComputeDeployment } from 'src/model';

import { DeploymentTrigger } from './deployment-trigger';

export function DeploymentHeader({ deployment }: { deployment: ComputeDeployment }) {
  return (
    <header className="col gap-2">
      <div className="row items-center gap-2">
        <div className="typo-heading">{deployment.name}</div>

        <CopyIconButton text={deployment.id} className="size-4" />

        <Tooltip
          allowHover
          content={<DeploymentMessages deployment={deployment} />}
          trigger={(props) => <DeploymentStatusBadge {...props} status={deployment.status} />}
        />

        <div className="ml-auto text-dim">
          <FormattedDistanceToNow value={deployment.date} style="narrow" />
        </div>

        {deployment.trigger?.type === 'git' && (
          <img src={deployment.trigger.commit.author.avatar} className="size-6 rounded-full" />
        )}
      </div>

      <div className="max-w-full self-start truncate text-dim">
        <DeploymentTrigger deployment={deployment} />
      </div>
    </header>
  );
}

function DeploymentMessages({ deployment }: { deployment: ComputeDeployment }) {
  return (
    <ol className="col gap-1">
      {deployment.messages.map((message, index) => (
        <li key={index}>{message}</li>
      ))}
    </ol>
  );
}
