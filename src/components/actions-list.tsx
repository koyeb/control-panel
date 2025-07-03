import clsx from 'clsx';
import { Children } from 'react';

import { SvgComponent } from 'src/application/types';

export function ActionsList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul
      className={clsx(
        'divide-y rounded-md border',
        '[&>li:first-child>*]:rounded-t-md [&>li:last-child>*]:rounded-b-md',
      )}
    >
      {Children.map(items, (item) => item && <li>{item}</li>)}
    </ul>
  );
}

type ActionsListButtonOwnProps = {
  Icon?: SvgComponent;
};

type ActionsListButtonProps = ActionsListButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ActionsListButtonOwnProps>;

export function ActionsListButton({ Icon, className, children, ...props }: ActionsListButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'w-full px-3 py-2',
        !props.disabled && 'hover:bg-muted/50',
        props.disabled && 'text-dim',
        className,
      )}
      {...props}
    >
      {children}
      {Icon && <Icon className="size-4" />}
    </button>
  );
}
