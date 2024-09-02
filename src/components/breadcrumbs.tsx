import clsx from 'clsx';

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
  link: string;
};

export function Crumb({ isFirst, label, link }: CrumbProps) {
  return (
    <>
      {!isFirst && (
        <div>
          <IconChevronRight className="text-icon size-em text-dim" />
        </div>
      )}

      <Link href={link} className="font-medium text-dim last-of-type:text-default">
        {label}
      </Link>
    </>
  );
}
