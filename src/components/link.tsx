import clsx from 'clsx';
import { createElement } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Link } from 'wouter';

import {
  buttonClassName,
  ButtonColor,
  ButtonSize,
  ButtonVariant,
  Spinner,
  TabButton,
} from '@koyeb/design-system';
import { Extend } from 'src/utils/types';

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

type LinkButtonProps = Extend<React.ComponentProps<'a'>, LinkButtonOwnProps>;

export function LinkButton({
  component = Link,
  disabled,
  openInNewTab,
  state,
  href = '',
  loading,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const props: React.ComponentProps<typeof Link> & { state?: unknown } = {
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
}

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
      className={clsx(TabButton.class({ selected, className }))}
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
