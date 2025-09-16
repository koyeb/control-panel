import { Button, ButtonColor, ButtonSize, ButtonVariant, MenuItem, TabButton } from '@koyeb/design-system';
import { Link as BaseLink, LinkComponent, ValidateLinkOptions, createLink } from '@tanstack/react-router';
import clsx from 'clsx';

import { Extend } from 'src/utils/types';

export { type ValidateLinkOptions };

export const Link = BaseLink;

type LinkButtonNativeProps = Extend<
  React.ComponentProps<'a'>,
  {
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    openInNewTab?: boolean;
  }
>;

function LinkButtonNative({
  variant,
  size,
  color,
  openInNewTab,
  className,
  ...props
}: LinkButtonNativeProps) {
  const disabled = props.href === undefined;

  return (
    <a
      role="button"
      target={openInNewTab ? '_blank' : undefined}
      aria-disabled={disabled}
      className={Button.className(
        { variant, size, color },
        clsx(className, { 'pointer-events-none opacity-50': disabled }),
      )}
      {...props}
    />
  );
}

export const LinkButton = createLink(LinkButtonNative);

type TabButtonNativeProps = Extend<
  React.ComponentProps<'a'>,
  {
    size?: 1 | 2;
    disabled?: boolean;
  }
>;

function TabButtonLinkNative({ size, disabled, className, ...props }: TabButtonNativeProps) {
  return (
    <a
      role="tab"
      aria-disabled={disabled}
      className={clsx(TabButton.className({ size, className }))}
      {...props}
    />
  );
}

const CreatedTabButtonLink = createLink(TabButtonLinkNative);

export const TabButtonLink: LinkComponent<typeof TabButtonLinkNative> = (props) => {
  return (
    <CreatedTabButtonLink
      activeOptions={{ exact: true, includeSearch: false }}
      inactiveProps={{ 'data-status': 'inactive' }}
      {...props}
    />
  );
};

type LinkMenuItemNativeProps = React.ComponentProps<'a'>;

export function LinkMenuItemNative({ className, ...props }: LinkMenuItemNativeProps) {
  return <a className={clsx(MenuItem.className({ className }))} {...props} />;
}

export const LinkMenuItem = createLink(LinkMenuItemNative);

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
      role="button"
      aria-disabled={disabled}
      className={Button.className({ variant, size, color }, className)}
      {...props}
    />
  );
}

export function ExternalLinkMenuItem({ className, ...props }: ExternalLinkProps) {
  return <ExternalLink className={MenuItem.className({ className })} {...props} />;
}
