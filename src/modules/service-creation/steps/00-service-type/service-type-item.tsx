import clsx from 'clsx';

type ServiceTypeItemProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  className?: string;
};

export function ServiceTypeItem({ icon, label, className }: ServiceTypeItemProps) {
  return (
    <div
      className={clsx(
        'row w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2',
        'hover:bg-muted/50',
        'group-data-[status=active]:bg-muted',
        className,
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}
