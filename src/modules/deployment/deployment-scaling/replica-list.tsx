import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { Replica } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate } from 'src/intl/translate';

import { ReplicaDrawer } from './replica-drawer';
import { ReplicaCpu, ReplicaMemory } from './replica-metadata';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export function ReplicaList({ replicas }: { replicas: Replica[] }) {
  if (replicas.length === 0) {
    return null;
  }

  return (
    <ul className="col gap-3">
      {replicas.map((replica) => (
        <li key={`${replica.region}-${replica.index}`}>
          <ReplicaItem replica={replica} />
        </li>
      ))}
    </ul>
  );
}

export function ReplicaItem({ replica }: { replica: Replica }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="row items-center gap-2 rounded-lg border bg-white/80 p-3">
      <RegionFlag regionId={replica.region} className="size-4" />

      <div className="min-w-8">
        <T id="replicaIndex" values={{ index: replica.index }} />
      </div>

      {!replica.status && (
        <div className="text-xs text-dim">
          <T id="noInstances" />
        </div>
      )}

      {replica.status && (
        <>
          <InstanceStatusBadge status={replica.status} />

          <div className="row ms-4 items-center gap-4">
            <ReplicaCpu value={0.5} />
            <ReplicaMemory value={0.65} />
          </div>

          <Button color="gray" size={1} onClick={() => setDrawerOpen(true)} className="ms-auto">
            Details
          </Button>
        </>
      )}

      <ReplicaDrawer replica={replica} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
