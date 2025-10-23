import { FieldLabel } from '@koyeb/design-system/next';
import clsx from 'clsx';
import { createElement } from 'react';

import { Extend } from 'src/utils/types';

import { InfoTooltip } from '../tooltip';

type LabelTooltipProps = Extend<
  React.ComponentProps<typeof FieldLabel>,
  {
    as?: 'span' | typeof FieldLabel;
    label: React.ReactNode;
    tooltip?: React.ReactNode;
    disabled?: boolean;
  }
>;

export function LabelTooltip({
  as = FieldLabel,
  label,
  tooltip,
  disabled,
  className,
  ...props
}: LabelTooltipProps) {
  if (!label) {
    return null;
  }

  return createElement(
    as,
    {
      className: clsx(
        disabled && 'text-dim',
        tooltip && 'inline-flex flex-row items-center gap-2',
        className,
      ),
      ...props,
    },
    <>
      {label}
      {tooltip && <InfoTooltip content={tooltip} />}
    </>,
  );
}
