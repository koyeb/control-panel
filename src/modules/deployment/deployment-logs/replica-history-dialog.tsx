import clsx from 'clsx';
import { useState } from 'react';
import { FormattedDate } from 'react-intl';

import { DialogHeader, Table, Tooltip } from '@koyeb/design-system';
import { useRegion } from 'src/api/hooks/catalog';
import { useInstancesQuery, useRegionalDeployment } from 'src/api/hooks/service';
import { ComputeDeployment, Instance } from 'src/api/model';
import { isDeploymentRunning } from 'src/application/service-functions';
import { CloseDialogButton, Dialog, DialogFooter } from 'src/components/dialog';
import { QueryGuard } from 'src/components/query-error';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

const T = createTranslate('modules.deployment.deploymentLogs.replicaHistory');

type ReplicaHistoryDialogProps = {
  deployment: ComputeDeployment;
  region: string;
  replicaIndex: number;
};

export function ReplicaHistoryDialog(props: ReplicaHistoryDialogProps) {
  const { deployment, region: regionId, replicaIndex } = props;
  const region = useRegion(regionId);

  return (
    <Dialog
      id="ReplicaHistory"
      context={{ deploymentId: deployment.id, regionId: regionId, replicaIndex }}
      className="col w-full max-w-3xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="subtitle" values={{ replicaIndex, region: region?.displayName }} />
      </p>

      <ReplicaHistory {...props} />

      <DialogFooter>
        <CloseDialogButton />
      </DialogFooter>
    </Dialog>
  );
}

export function ReplicaHistory({ deployment, region, replicaIndex }: ReplicaHistoryDialogProps) {
  const regionalDeployment = useRegionalDeployment(deployment.id, region);

  const [page, setPage] = useState(0);

  const query = useInstancesQuery({
    regionalDeploymentId: regionalDeployment?.id,
    replicaIndex,
    limit: 10,
    offset: page * 10,
  });

  return (
    <QueryGuard query={query}>
      {({ count, instances }) => (
        <>
          <InstancesList deployment={deployment} instances={instances} />

          <div className={clsx('row gap-2', count <= 10 && '!hidden')}>
            {createArray(Math.ceil(count / 10), (index) => (
              <button
                type="button"
                className={clsx(index === page && 'underline')}
                onClick={() => setPage(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </QueryGuard>
  );
}

function InstancesList({ deployment, instances }: { deployment: ComputeDeployment; instances: Instance[] }) {
  if (instances.length === 0) {
    return <T id={isDeploymentRunning(deployment) ? 'noInstancesYet' : 'noInstances'} />;
  }

  return (
    <Table
      items={instances}
      columns={{
        id: {
          header: <T id="id" />,
          render: (instance) => instance.name,
        },
        status: {
          header: <T id="status" />,
          render: (instance) => <InstanceStatusBadge status={instance.status} />,
        },
        createdAt: {
          header: <T id="createdAt" />,
          render: (instance) => (
            <div className="text-nowrap">
              <FormattedDate value={instance.createdAt} dateStyle="medium" timeStyle="medium" />
            </div>
          ),
        },
        messages: {
          header: <T id="messages" />,
          render: (instance) => (
            <Tooltip content={instance.messages.join(' ')}>
              {(props) => (
                <div {...props} className="line-clamp-1">
                  {instance.messages.join(' ')}
                </div>
              )}
            </Tooltip>
          ),
        },
      }}
    />
  );
}
