import clsx from 'clsx';
import { createElement } from 'react';

import { IconChevronRight } from 'src/components/icons';
import { Link } from 'src/components/link';

type BreadcrumbsProps = {
  className?: string;
  children: React.ReactNode;
};

export function Breadcrumbs({ className, children }: BreadcrumbsProps) {
  return <div className={clsx('row items-center gap-2 whitespace-nowrap', className)}>{children}</div>;
}

type CrumbProps = {
  isFirst?: boolean;
  label: React.ReactNode;
  link?: string;
};

export function Crumb({ isFirst, label, link }: CrumbProps) {
  const [element, props]: [React.ElementType, object] = link ? [Link, { href: link }] : ['span', {}];

  return (
    <>
      {!isFirst && (
        <div>
          <IconChevronRight className="size-em text-dim" />
        </div>
      )}

      {createElement(
        element,
        { ...props, className: 'font-medium text-dim last-of-type:text-default' },
        label,
      )}
    </>
  );
}
