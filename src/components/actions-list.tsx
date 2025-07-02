import clsx from 'clsx';
import { Children } from 'react';

import { SvgComponent } from 'src/application/types';

import { ExternalLink, Link } from './link';

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

type ActionsListLinkOwnProps = {
  to: string;
  Icon: SvgComponent;
  openInNewTab?: true;
};

type ActionsListLinkProps = ActionsListLinkOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ActionsListLinkOwnProps>;

export function ActionsListLink({ to, Icon, className, children, ...props }: ActionsListLinkProps) {
  const [Component, linkProps]: [typeof Link, { to: string }] | [typeof ExternalLink, { href: string }] =
    to.startsWith('/') ? [Link, { to }] : [ExternalLink, { href: to }];

  return (
    <Component className={clsx('px-3 py-2 hover:bg-muted/50', className)} {...linkProps} {...props}>
      {children}
      <Icon className="size-4" />
    </Component>
  );
}
