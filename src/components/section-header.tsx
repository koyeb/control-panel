import clsx from 'clsx';

type SectionHeaderProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={clsx('col gap-2', className)}>
      <h2 className="font-medium">{title}</h2>
      <p className="max-w-4xl text-dim">{description}</p>
    </div>
  );
}
