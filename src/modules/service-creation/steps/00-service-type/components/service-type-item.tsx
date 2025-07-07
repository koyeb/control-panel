import clsx from 'clsx';

type ServiceTypeItemProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  className?: string;
};

export function ServiceTypeItem({ icon, label }: ServiceTypeItemProps) {
  return (
    <div
      className={clsx(
        'row w-full items-center gap-2 rounded-md px-3 py-2 whitespace-nowrap hover:bg-muted/50',
        'group-data-[status=active]:bg-muted group-data-[status=active]:hover:bg-muted',
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}
