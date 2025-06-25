import { FormattedNumber } from 'react-intl';

import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export function ReplicaCpu({ value }: { value: number }) {
  return (
    <div className="row items-center gap-2">
      <div className="text-xs text-dim">
        <T id="metadata.cpu" />
      </div>

      <ProgressBar progress={value} />

      <div className="text-xs">
        <FormattedNumber value={value} style="percent" />
      </div>
    </div>
  );
}

export function ReplicaMemory({ value }: { value: number }) {
  return (
    <div className="row items-center gap-2">
      <div className="text-xs text-dim">
        <T id="metadata.memory" />
      </div>

      <ProgressBar progress={value} />

      <div className="text-xs">
        <FormattedNumber value={value} style="percent" />
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100);

  return (
    <div className="relative h-1.5 w-10 rounded-full bg-gray/30">
      <div
        className="absolute inset-y-0 left-0 rounded-l-full bg-green transition-[width] will-change-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
