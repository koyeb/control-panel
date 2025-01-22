import clsx from 'clsx';
import React, { JSX, createElement } from 'react';

import { Extend } from '../utils/types';

export function Menu({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <div
      className={clsx(
        'col z-30 items-stretch rounded-md border bg-popover p-1 text-contrast-popover shadow-lg',
        className,
      )}
      {...props}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Element = keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>;

type MenuItemOwnProps<E extends Element> = {
  element?: E;
  className?: string;
  children?: React.ReactNode;
};

type MenuItemProps<E extends Element> = Extend<React.ComponentProps<E>, MenuItemOwnProps<E>>;

export function MenuItem<E extends Element>({ element, className, children, ...props }: MenuItemProps<E>) {
  return createElement(
    element ?? 'div',
    {
      className: clsx(
        'row w-full items-center gap-2 rounded px-1.5 py-2 hover:bg-muted disabled:text-dim disabled:hover:bg-transparent',
        className,
      ),
      ...props,
    },
    children,
  );
}

export function ButtonMenuItem(props: React.ComponentProps<'button'>) {
  return <MenuItem element="button" type="button" {...props} />;
}
