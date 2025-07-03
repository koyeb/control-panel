import { Button, ButtonColor, ButtonSize, ButtonVariant, Spinner, TabButton } from '@koyeb/design-system';
import clsx from 'clsx';
import { createElement } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Link as BaseLink } from 'wouter';

import { Extend } from 'src/utils/types';

type LinkProps = Extend<
  React.ComponentProps<'a'>,
  {
    to?: string;
    search?: Partial<Record<string, string | null>>;
    state?: unknown;
  }
>;

export function Link({ to, search, ...props }: LinkProps) {
  const params = new URLSearchParams();

  if (search) {
    for (const [key, value] of Object.entries(search)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  let href = to ?? '';

  if (params.size > 0) {
    href += '?' + params.toString();
  }

  return <BaseLink href={href} {...props} />;
}

type LinkButtonOwnProps = Extend<
  Pick<LinkProps, 'to' | 'search' | 'state'>,
  {
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    loading?: boolean;
    component?: 'a' | typeof Link;
    openInNewTab?: boolean;
    disabled?: boolean;
  }
>;

type LinkButtonProps = Extend<React.ComponentProps<'a'>, LinkButtonOwnProps>;

export function LinkButton({
  component = Link,
  disabled,
  openInNewTab,
  state,
  to = '',
  search,
  loading,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const props: React.ComponentProps<typeof Link> & { state?: unknown } = {
    to,
    'aria-disabled': disabled,
    className: Button.className(rest, clsx(disabled && 'pointer-events-none opacity-50', className)),
    ...rest,
  };

  if (openInNewTab) {
    props.target = '_blank';

    if (component === 'a') {
      props.rel = 'noopener noreferrer';
    }
  }

  if (component === Link) {
    props.state = state;
    props.search = search;
  }

  return createElement(
    component,
    props,
    <>
      {loading && <Spinner className="size-4" />}
      {children}
    </>,
  );
}

type TabButtonLinkProps = {
  to: string;
  selected: boolean;
  panelId?: string;
  className?: string;
  children?: React.ReactNode;
};

export function TabButtonLink({ to, selected, panelId, className, children }: TabButtonLinkProps) {
  return (
    <Link
      to={to}
      role="tab"
      className={clsx(TabButton.className({ selected, className }))}
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

export function ExternalLink({ openInNewTab, ...props }: ExternalLinkProps) {
  return <a target={openInNewTab ? '_blank' : undefined} rel="noopener noreferrer" {...props} />;
}

export function ExternalLinkButton(props: LinkButtonProps) {
  return <LinkButton component="a" rel="noopener noreferrer" {...props} />;
}
