import { ProgressBar } from '@koyeb/design-system';
import { FormattedNumber } from 'react-intl';

import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.deployment.deploymentLogs.scaling');

export function ReplicaCpu({ value }: { value: number }) {
  return (
    <div className="row items-center gap-2">
      <div className="text-xs text-dim">
        <T id="metadata.cpu" />
      </div>

      <ProgressBar progress={value} className="w-10" />

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

      <ProgressBar progress={value} className="w-10" />

      <div className="text-xs">
        <FormattedNumber value={value} style="percent" />
      </div>
    </div>
  );
}
