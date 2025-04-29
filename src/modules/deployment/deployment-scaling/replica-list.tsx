import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { ComputeDeployment, Replica } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate } from 'src/intl/translate';

import { ReplicaDrawer } from './replica-drawer';
import { ReplicaCpu, ReplicaMemory } from './replica-metadata';
import { useReplicaMetricsQuery } from './replica-metrics';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

type ReplicaListProps = {
  deployment: ComputeDeployment;
  replicas: Replica[];
};

export function ReplicaList({ deployment, replicas }: ReplicaListProps) {
  const metrics = useReplicaMetricsQuery(deployment);

  if (replicas.length === 0 || metrics.isPending) {
    return null;
  }

  return (
    <ul className="col gap-3">
      {replicas.map((replica) => (
        <li key={`${replica.region}-${replica.index}`}>
          <ReplicaItem
            deployment={deployment}
            replica={replica}
            metrics={replica.instanceId ? metrics.data[replica.instanceId] : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

type ReplicaItemProps = {
  deployment: ComputeDeployment;
  replica: Replica;
  metrics?: { cpu?: number; memory?: number };
};

export function ReplicaItem({ deployment, replica, metrics }: ReplicaItemProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-3 rounded-lg border p-3 sm:grid-cols-[auto_1fr_auto]">
      <div className="row items-center gap-2 sm:order-1">
        <RegionFlag regionId={replica.region} className="size-4" />

        <div className="min-w-8">
          <T id="replicaIndex" values={{ index: replica.index }} />
        </div>

        {replica.status && <InstanceStatusBadge status={replica.status} />}
      </div>

      <Button color="gray" size={1} onClick={() => setDrawerOpen(true)} className="ms-auto sm:order-3">
        <T id="details" />
      </Button>

      {!replica.status && (
        <div className="text-xs text-dim sm:order-2">
          <T id="noInstances" />
        </div>
      )}

      {replica.status && (
        <div className="row col-span-full items-center gap-4 sm:order-2 sm:col-span-1">
          {metrics?.cpu !== undefined && <ReplicaCpu value={metrics.cpu} />}
          {metrics?.memory !== undefined && <ReplicaMemory value={metrics.memory} />}
        </div>
      )}

      <ReplicaDrawer
        deployment={deployment}
        replica={replica}
        open={drawerOpen}
        metrics={metrics}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
