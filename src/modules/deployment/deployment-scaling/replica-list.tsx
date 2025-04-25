import { Button } from '@koyeb/design-system';
import { ComputeDeployment, Replica } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export function ReplicaList({ replicas }: { deployment: ComputeDeployment; replicas: Replica[] }) {
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

          <div className="row ms-4 items-center gap-2">
            <div className="text-xs text-dim">CPU</div>
            <ProgressBar progress={0.4} />
            <div>40%</div>
          </div>

          <div className="row ms-2 items-center gap-2">
            <span className="text-xs text-dim">Memory</span>
            <ProgressBar progress={0.65} />
            <div>65%</div>
          </div>

          <Button color="gray" size={1} className="ms-auto">
            Details
          </Button>
        </>
      )}
    </div>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100);

  return (
    <div className="relative h-1.5 w-10 rounded-full bg-gray/30">
      <div
        // eslint-disable-next-line tailwindcss/no-arbitrary-value
        className="absolute inset-y-0 left-0 rounded-full bg-green transition-[width] will-change-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
