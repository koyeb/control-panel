import clsx from 'clsx';

type TabButtonsProps = {
  className?: string;
  children?: React.ReactNode;
};

export function TabButtons({ className, children }: TabButtonsProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div role="tablist" className={clsx('row w-fit gap-2 rounded-md bg-muted p-1', className)}>
        {children}
      </div>
    </div>
  );
}

type TabButtonProps = {
  selected: boolean;
  disabled?: boolean;
  panelId?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function TabButton({ selected, disabled, panelId, onClick, className, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      className={clsx(
        'col focusable flex-1 items-center whitespace-nowrap rounded px-3 py-2 font-medium transition-all',
        'disabled:pointer-events-none disabled:opacity-50',
        !selected && 'text-dim hover:bg-neutral/50 hover:text-default',
        selected && 'bg-neutral',
        className,
      )}
      aria-selected={selected}
      aria-controls={panelId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
