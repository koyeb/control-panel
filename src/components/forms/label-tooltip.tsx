import { FieldLabel } from '@koyeb/design-system/next';
import clsx from 'clsx';

import { Extend } from 'src/utils/types';

import { InfoTooltip } from '../tooltip';

type LabelTooltipProps = Extend<
  React.ComponentProps<typeof FieldLabel>,
  {
    label: React.ReactNode;
    tooltip?: React.ReactNode;
  }
>;

export function LabelTooltip({ label, tooltip, className, ...props }: LabelTooltipProps) {
  if (!label) {
    return null;
  }

  return (
    <FieldLabel className={clsx(tooltip && 'inline-flex flex-row items-center gap-2', className)} {...props}>
      {label}
      {tooltip && <InfoTooltip content={tooltip} />}
    </FieldLabel>
  );
}
