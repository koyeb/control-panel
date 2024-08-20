import clsx from 'clsx';
import { forwardRef } from 'react';

type ButtonGroupProps = React.ComponentProps<'div'>;

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'row items-stretch divide-x divide-gray/20 dark:divide-gray/80',
        '[&>button]:rounded-none',
        '[&>button]:border-gray/20 [&>button]:dark:border-gray/80',
        '[&>button:first-of-type]:rounded-l-lg',
        '[&>button:last-of-type]:rounded-r-lg [&>button:last-of-type]:!border-r',
        className,
      )}
      {...props}
    />
  );
});
