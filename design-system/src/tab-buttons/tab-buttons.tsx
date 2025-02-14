import { cva } from 'class-variance-authority';

type TabButtonsProps = {
  className?: string;
  children?: React.ReactNode;
};

export function TabButtons({ className, children }: TabButtonsProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div role="tablist" className={tabButtons({ className })}>
        {children}
      </div>
    </div>
  );
}

const tabButtons = cva('row w-fit gap-2 rounded-md bg-muted p-1');

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
      className={tabButton({ className, selected })}
      aria-selected={selected}
      aria-controls={panelId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const tabButton = cva(
  [
    'col focusable flex-1 items-center whitespace-nowrap rounded px-3 py-2 font-medium transition-all',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      selected: {
        false: 'text-dim hover:bg-neutral/50 hover:text-default',
        true: 'bg-neutral',
      },
    },
  },
);
