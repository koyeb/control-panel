import clsx from 'clsx';
import { createElement } from 'react';

type TabsProps = {
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ className, children }: TabsProps) {
  return (
    <nav
      role="tablist"
      className={clsx('row hide-scrollbars flex-nowrap overflow-x-auto border-b', className)}
    >
      {children}
    </nav>
  );
}

type TabProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: string | React.ComponentType<any>;
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
};

export function Tab({ component = 'button', className, selected, children, ...props }: TabProps) {
  return createElement(
    component,
    {
      role: 'tab',
      'aria-selected': selected,
      className: clsx(
        'inline-block whitespace-nowrap border-b-2 px-4 py-2 font-semibold outline-none transition-colors focus-visible:bg-green/10',
        selected && 'border-green',
        !selected && 'border-transparent text-dim',
        className,
      ),
      ...props,
    },
    children,
  );
}

type VerticalTabsProps = {
  className?: string;
  children: React.ReactNode;
};

export function VerticalTabs({ className, children }: VerticalTabsProps) {
  return (
    <nav role="tablist" className={clsx('col', className)}>
      {children}
    </nav>
  );
}

type VerticalTabProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: string | React.ComponentType<any>;
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
};

export function VerticalTab({ component, className, selected, children, ...props }: VerticalTabProps) {
  return createElement(
    component,
    {
      role: 'tab',
      'aria-selected': selected,
      className: clsx(
        'rounded px-4 py-3 text-left font-medium hover:bg-green/20',
        !selected && 'text-dim',
        className,
      ),
      ...props,
    },
    children,
  );
}
