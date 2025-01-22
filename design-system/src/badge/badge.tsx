import clsx from 'clsx';

import { Extend } from '../utils/types';

export type BadgeSize = 1 | 2;
export type BadgeColor = 'red' | 'green' | 'blue' | 'orange' | 'gray';

type BadgeOwnProps = {
  size?: BadgeSize;
  color?: BadgeColor;
};

type BadgeProps = Extend<React.ComponentProps<'span'>, BadgeOwnProps>;

export function Badge({ size = 2, color = 'gray', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'rounded-md text-center font-medium',
        {
          'px-2 py-0.5 text-xs': size === 1,
          'px-3 py-1': size === 2,
        },
        {
          'text-red bg-red/10': color === 'red',
          'text-green bg-green/10': color === 'green',
          'text-blue bg-blue/10': color === 'blue',
          'text-orange bg-orange/10': color === 'orange',
          'text-dim bg-gray/10': color === 'gray',
        },
        className,
      )}
      {...props}
    />
  );
}
