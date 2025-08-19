import clsx from 'clsx';

type MetadataProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

export function Metadata({ label, value, className }: MetadataProps) {
  return (
    <div className={clsx('col gap-1', className)}>
      <dt className="whitespace-nowrap text-dim">{label}</dt>
      <dd className="line-clamp-2">{value}</dd>
    </div>
  );
}
