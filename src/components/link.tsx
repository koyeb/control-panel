import { Button, ButtonColor, ButtonSize, ButtonVariant, MenuItem, TabButton } from '@koyeb/design-system';
import clsx from 'clsx';
// eslint-disable-next-line no-restricted-imports
import { Link as BaseLink, useRoute } from 'wouter';

import { replacePathParams } from 'src/hooks/router';
import { Extend } from 'src/utils/types';

export type ValidateLinkOptions = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string | undefined>;
};

type LinkProps = Extend<
  Omit<React.ComponentProps<'a'>, 'href'>,
  {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string | undefined>;
    state?: Record<string, unknown>;
  }
>;

export function Link({ to, params, search, ...props }: LinkProps) {
  let href = replacePathParams(to, params);

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(search ?? {})) {
    if (value != null) {
      searchParams.set(key, String(value));
    }
  }

  if (searchParams.size > 0) {
    href += '?' + searchParams.toString();
  }

  return <BaseLink href={href} {...props} />;
}

type LinkButtonProps = Extend<
  LinkProps,
  {
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    openInNewTab?: boolean;
    disabled?: boolean;
  }
>;

export function LinkButton({
  variant,
  size,
  color,
  openInNewTab,
  disabled,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      role="button"
      target={openInNewTab ? '_blank' : undefined}
      aria-disabled={disabled}
      className={Button.className(
        { variant, size, color },
        clsx(className, disabled && 'pointer-events-none opacity-50'),
      )}
      {...props}
    />
  );
}

type TabButtonProps = Extend<
  LinkProps,
  {
    size?: 1 | 2;
    disabled?: boolean;
  }
>;

export function TabButtonLink({ size, disabled, className, ...props }: TabButtonProps) {
  const [isActive] = useRoute(replacePathParams(props.to, props.params));

  return (
    <Link
      role="tab"
      aria-disabled={disabled}
      data-status={isActive ? 'active' : 'inactive'}
      className={clsx(TabButton.className({ size, className }))}
      {...props}
    />
  );
}

type LinkMenuItemProps = LinkProps;

export function LinkMenuItem({ className, ...props }: LinkMenuItemProps) {
  return <Link className={clsx(MenuItem.className({ className }))} {...props} />;
}

type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  openInNewTab?: boolean;
};

export function ExternalLink({ openInNewTab, ...props }: ExternalLinkProps) {
  return <a target={openInNewTab ? '_blank' : undefined} rel="noopener noreferrer" {...props} />;
}

type ExternalLinkButtonProps = Extend<
  ExternalLinkProps,
  {
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    disabled?: boolean;
  }
>;

export function ExternalLinkButton({
  variant,
  size,
  color,
  disabled,
  className,
  ...props
}: ExternalLinkButtonProps) {
  return (
    <ExternalLink
      arias-disabled={disabled}
      className={Button.className({ variant, size, color }, className)}
      {...props}
    />
  );
}

export function ExternalLinkMenuItem({ className, ...props }: ExternalLinkProps) {
  return <ExternalLink className={MenuItem.className({ className })} {...props} />;
}
