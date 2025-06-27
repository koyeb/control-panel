import clsx from 'clsx';

type ServiceTypeItemProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function ServiceTypeItem({ icon, label, active, onClick, className }: ServiceTypeItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'row w-full items-center gap-2 rounded-md px-3 py-2 whitespace-nowrap',
          !active && 'hover:bg-muted/50',
          active && 'bg-muted',
          className,
        )}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </button>
    </li>
  );
}
