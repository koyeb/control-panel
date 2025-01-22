import clsx from 'clsx';

type ButtonGroupProps = React.ComponentProps<'div'>;

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
  return (
    <div
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
}
