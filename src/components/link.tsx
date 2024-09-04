import clsx from 'clsx';
import { createElement, forwardRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Link } from 'wouter';

import { ButtonVariant, ButtonSize, ButtonColor, buttonClassName, Spinner } from '@koyeb/design-system';

export { Link };

type LinkButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  loading?: boolean;
  component?: 'a' | typeof Link;
  openInNewTab?: boolean;
  disabled?: boolean;
  state?: unknown;
};

type LinkButtonProps = LinkButtonOwnProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { component = Link, disabled, openInNewTab, state, href = '', loading, className, children, ...rest },
  ref,
) {
  const props: React.ComponentProps<typeof Link> & { state?: unknown } = {
    ref,
    href,

    'aria-disabled': disabled,
    className: buttonClassName(rest, clsx(disabled && 'pointer-events-none opacity-50', className)),
    ...rest,
  };

  if (openInNewTab) {
    props.target = '_blank';

    if (component === 'a') {
      props.rel = 'noopener noreferrer';
    }
  }

  if (component === Link && state !== undefined) {
    props.state = state;
  }

  return createElement(
    component,
    props,
    <>
      {loading && <Spinner className="size-4" />}
      {children}
    </>,
  );
});

type TabButtonLinkProps = {
  href: string;
  selected: boolean;
  panelId?: string;
  className?: string;
  children?: React.ReactNode;
};

export function TabButtonLink({ href, selected, panelId, className, children }: TabButtonLinkProps) {
  return (
    <Link
      href={href}
      role="tab"
      className={clsx(
        'col focusable flex-1 items-center rounded px-3 py-2 font-medium transition-all',
        !selected && 'text-dim hover:bg-neutral/50 hover:text-default',
        selected && 'bg-neutral',
        className,
      )}
      aria-selected={selected}
      aria-controls={panelId}
    >
      {children}
    </Link>
  );
}

type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  openInNewTab?: boolean;
};

export const ExternalLink = forwardRef<HTMLAnchorElement, ExternalLinkProps>(function ExternalLink(
  { openInNewTab, ...props },
  ref,
) {
  return <a ref={ref} target={openInNewTab ? '_blank' : undefined} rel="noopener noreferrer" {...props} />;
});

export const ExternalLinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function ExternalLink(props, ref) {
    return <LinkButton ref={ref} component="a" rel="noopener noreferrer" {...props} />;
  },
);
