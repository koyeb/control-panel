import clsx from 'clsx';
import { forwardRef, isValidElement } from 'react';

import { Spinner } from '../spinner/spinner';
import { Tooltip } from '../tooltip/tooltip';
import { useBreakpoint } from '../utils/media-query';
import { mergeRefs } from '../utils/merge-refs';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonSize = 1 | 2 | 3;
export type ButtonColor = 'green' | 'blue' | 'orange' | 'red' | 'gray';

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  loading?: boolean;
};

type ButtonProps = ButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { loading, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={loading}
      className={buttonClassName(props, className)}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

type IconButtonComponentProps = {
  Icon: React.ComponentType<{ className?: string }>;
};

type IconButtonNodeProps = {
  icon: Exclude<React.ReactNode, undefined | null>;
};

type IconButtonProps = ButtonProps & (IconButtonComponentProps | IconButtonNodeProps);

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'outline', className, children, ...props },
  ref,
) {
  // prettier-ignore
  const { Icon, icon, ...rest } = props as ButtonProps & Partial<IconButtonComponentProps & IconButtonNodeProps>;
  const sm = useBreakpoint('sm');

  const getIcon = () => {
    if (isValidElement(icon)) {
      return icon;
    }

    if (Icon !== undefined) {
      return <Icon className="size-5 text-dim" />;
    }
  };

  return (
    <Tooltip content={sm && children}>
      {({ ref: tooltipRef, ...tooltip }) => (
        <Button
          ref={mergeRefs(ref, tooltipRef)}
          variant={variant}
          className={clsx('!px-2', className)}
          {...rest}
          {...tooltip}
        >
          {children && <span className="sm:hidden">{children}</span>}
          {getIcon()}
        </Button>
      )}
    </Tooltip>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function buttonClassName(
  { variant = 'solid', size = 2, color = 'green' }: ButtonOwnProps,
  className?: string,
) {
  return clsx(
    'inline-flex items-center justify-center whitespace-nowrap',
    'focusable rounded-md font-medium transition-colors',
    sizeClass(size),
    hoverClass(color),
    focusClass(color),
    variant === 'solid' && solidClass(color),
    variant === 'outline' && outlineClass(color),
    variant === 'ghost' && ghostClass(color),
    className,
  );
}

function sizeClass(size: ButtonSize) {
  return clsx({
    'gap-1 min-h-6 px-2 text-xs': size === 1,
    'gap-2.5 min-h-8 px-3': size === 2,
    'gap-2.5 min-h-10 px-4': size === 3,
  });
}

function hoverClass(color: ButtonColor) {
  return clsx(
    color === 'green' && 'hover:bg-green/90 hover:text-contrast-green',
    color === 'blue' && 'hover:bg-blue/90 hover:text-contrast-blue',
    color === 'orange' && 'hover:bg-orange/90 hover:text-contrast-orange',
    color === 'red' && 'hover:bg-red/90 hover:text-contrast-red',
    color === 'gray' && 'hover:bg-muted/90',
  );
}

function focusClass(color: ButtonColor) {
  return clsx(
    color === 'green' && 'outline-green/50 focus-visible:bg-green/80',
    color === 'blue' && 'outline-blue/50 focus-visible:bg-blue/80',
    color === 'orange' && 'outline-orange/50 focus-visible:bg-orange/80',
    color === 'red' && 'outline-red/50 focus-visible:bg-red/80',
    color === 'gray' && 'outline-gray focus-visible:bg-muted/80',
  );
}

function solidClass(color: ButtonColor) {
  // prettier-ignore
  return clsx(
    color === 'green' && 'bg-green text-contrast-green disabled:bg-green/50 dark:disabled:text-contrast-green/50',
    color === 'blue' && 'bg-blue text-contrast-blue disabled:bg-blue/50 dark:disabled:text-contrast-blue/50',
    color === 'orange' && 'bg-orange text-contrast-orange disabled:bg-orange/50 dark:disabled:text-contrast-orange/50',
    color === 'red' && 'bg-red text-contrast-red disabled:bg-red/50 dark:disabled:text-contrast-red/50',
    color === 'gray' && 'bg-muted disabled:bg-muted disabled:text-dim',
  );
}

function outlineClass(color: ButtonColor) {
  return clsx(
    'border disabled:border-default disabled:bg-muted disabled:text-dim',
    color === 'green' && 'border-green',
    color === 'blue' && 'border-blue',
    color === 'orange' && 'border-orange',
    color === 'red' && ' border-red',
  );
}

function ghostClass(color: ButtonColor) {
  return clsx(
    'border border-transparent',
    color === 'green' && 'text-green disabled:bg-green/50 disabled:text-contrast-green',
    color === 'blue' && 'text-blue disabled:bg-blue/50 disabled:text-contrast-blue',
    color === 'orange' && 'text-orange disabled:bg-orange/50 disabled:text-contrast-orange',
    color === 'red' && 'text-red disabled:bg-red/50 disabled:text-contrast-red',
    color === 'gray' && 'disabled:bg-muted disabled:text-dim',
  );
}
