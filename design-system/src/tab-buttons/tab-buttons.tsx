import { cva } from 'class-variance-authority';

type TabButtonsProps = {
  size?: 1 | 2;
  className?: string;
  children?: React.ReactNode;
};

export function TabButtons({ size = 2, className, children }: TabButtonsProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div role="tablist" className={TabButtons.class({ size, className })}>
        {children}
      </div>
    </div>
  );
}

TabButtons.class = cva('row w-fit gap-2 rounded-md bg-muted p-1', {
  variants: {
    size: {
      1: 'h-8',
      2: 'h-10',
    },
  },
});

type TabButtonProps = {
  size?: 1 | 2;
  selected: boolean;
  disabled?: boolean;
  panelId?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function TabButton({
  size,
  selected,
  disabled,
  panelId,
  onClick,
  className,
  children,
}: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      className={TabButton.class({ size, selected, className })}
      aria-selected={selected}
      aria-controls={panelId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

TabButton.class = cva(
  [
    'col h-full flex-1 items-center justify-center',
    'focusable whitespace-nowrap rounded px-3 transition-all',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        1: 'text-xs',
        2: 'font-medium',
      },
      selected: {
        false: 'text-dim hover:bg-neutral/50 hover:text-default',
        true: 'bg-neutral',
      },
    },
  },
);
