import clsx from 'clsx';

type StatusIconColor = 'red' | 'green' | 'blue' | 'orange' | 'gray';

type StatusIconProps = {
  color: StatusIconColor;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
};

export function StatusIcon({ color, Icon, className }: StatusIconProps) {
  return (
    <span
      className={clsx(
        'inline-block rounded-full p-1.5',
        {
          'bg-red/20 text-red': color === 'red',
          'bg-green/20 text-green': color === 'green',
          'bg-blue/20 text-blue': color === 'blue',
          'bg-orange/20 text-orange': color === 'orange',
          'bg-inverted/20 text-inverted': color === 'gray',
        },
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}
