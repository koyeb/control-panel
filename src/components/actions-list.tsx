import clsx from 'clsx';
import { Children, createElement } from 'react';

import { Link } from './link';

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
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type ActionsListButtonProps = ActionsListButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ActionsListButtonOwnProps>;

export function ActionsListButton({ icon: Icon, className, children, ...props }: ActionsListButtonProps) {
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

type ActionsListLinkOwnProps = {
  component?: 'a' | typeof Link;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  openInNewTab?: true;
};

type ActionsListLinkProps = ActionsListLinkOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ActionsListLinkOwnProps>;

export function ActionsListLink({
  component = Link,
  icon: Icon,
  openInNewTab,
  className,
  children,
  ...props
}: ActionsListLinkProps) {
  return createElement(
    component,
    {
      className: clsx('px-3 py-2 hover:bg-muted/50', className),
      ...(openInNewTab && { target: '_blank', rel: 'noopener noreferrer' }),
      ...props,
    },
    <>
      {children}
      <Icon className="size-4" />
    </>,
  );
}
