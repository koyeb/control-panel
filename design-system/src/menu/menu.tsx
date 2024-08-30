import clsx from 'clsx';
import React, { createElement, forwardRef } from 'react';

export const Menu = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Menu(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'col z-30 items-stretch rounded-md border bg-popover p-1 text-contrast-popover shadow-lg',
        className,
      )}
      {...props}
    />
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Element = keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>;

type MenuItemProps<E extends Element> = {
  element?: E;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<E>, 'element' | 'className' | 'children'>;

function MenuItem_<E extends Element>(
  { element, className, children, ...props }: MenuItemProps<E>,
  ref: React.ForwardedRef<React.ElementRef<E>>,
) {
  return createElement(
    element ?? 'div',
    {
      ref,
      className: clsx(
        'row w-full items-center gap-2 rounded px-1.5 py-2 hover:bg-muted disabled:text-dim disabled:hover:bg-transparent',
        className,
      ),
      ...props,
    },
    children,
  );
}

export const MenuItem = forwardRef(MenuItem_);

export const ButtonMenuItem = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function ButtonMenuItem(props, ref) {
    return <MenuItem ref={ref} element="button" type="button" {...props} />;
  },
);
