import IconChevronRight from 'lucide-static/icons/chevron-right.svg?react';
import IconHouse from 'lucide-static/icons/house.svg?react';

import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';

type BreadcrumbsProps = {
  children: React.ReactNode;
};

export function Breadcrumbs({ children }: BreadcrumbsProps) {
  return (
    <div className="row items-center gap-2">
      <Crumb isFirst label={<IconHouse className="icon" />} link={routes.home()} />
      {children}
    </div>
  );
}

type CrumbProps = {
  isFirst?: boolean;
  label: React.ReactNode;
  link: string;
};

export function Crumb({ isFirst, label, link }: CrumbProps) {
  return (
    <>
      {!isFirst && <IconChevronRight className="text-icon size-em text-dim" />}

      <Link href={link} className="font-medium text-dim last-of-type:text-default">
        {label}
      </Link>
    </>
  );
}
