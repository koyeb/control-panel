import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { apiQuery } from 'src/api';
import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';

import { OrganizationSwitcher } from '../organization-switcher';

import { UserMenu } from './user-menu';

export function SecondaryLayoutHeader({ className }: { className?: string }) {
  const { data: hasMultipleOrganizations } = useQuery({
    ...apiQuery('get /v1/account/organizations', { query: {} }),
    select: ({ organizations }) => organizations!.length > 1,
  });

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-10 row flex-wrap items-center gap-4 bg-gradient-to-b from-neutral from-75% to-transparent p-4',
        className,
      )}
    >
      <Link to="/">
        <LogoKoyeb className="h-8" />
      </Link>

      {hasMultipleOrganizations && <OrganizationSwitcher className="w-48" />}

      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
