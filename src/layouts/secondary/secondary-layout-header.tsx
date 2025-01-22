import clsx from 'clsx';
import { useState } from 'react';

import { Floating } from '@koyeb/design-system';
import { isApiError } from 'src/api/api-errors';
import { useOrganizationUnsafe, useUserQuery } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { IconChevronUpDown } from 'src/components/icons';
import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { OrganizationAvatar } from 'src/components/organization-avatar';

import { OrganizationSwitcherMenu } from '../organization-switcher-menu';

import { UserMenu } from './user-menu';

export function SecondaryLayoutHeader({ background }: { background?: boolean }) {
  const userQuery = useUserQuery();

  const accountLocked = userQuery.isError && isApiError(userQuery.error) && userQuery.error.status === 403;
  const isAuthenticated = userQuery.isSuccess || accountLocked;

  return (
    <header
      className={clsx(
        'row sticky top-0 z-10 flex-wrap items-center gap-6 px-6 py-4',
        background && 'bg-gradient-to-b from-neutral from-75% to-transparent',
      )}
    >
      <Link href={routes.home()}>
        <LogoKoyeb className={clsx('h-8 self-start', !background && 'text-white')} />
      </Link>

      {isAuthenticated && (
        <>
          <OrganizationSwitcher />
          <UserMenu />
        </>
      )}
    </header>
  );
}

function OrganizationSwitcher() {
  const currentOrganization = useOrganizationUnsafe();
  const [open, setOpen] = useState(false);

  if (currentOrganization === undefined) {
    return null;
  }

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      strategy="fixed"
      placement="bottom-start"
      offset={8}
      renderReference={(props) => (
        <button
          type="button"
          data-testid="organization-switcher"
          className="row items-center gap-2 rounded-lg text-start"
          onClick={() => setOpen(!open)}
          {...props}
        >
          <OrganizationAvatar className="size-6 rounded-full" />
          <span className="flex-1 font-medium">{currentOrganization.name}</span>
          <IconChevronUpDown className="size-4 text-dim" />
        </button>
      )}
      renderFloating={(props) => (
        <OrganizationSwitcherMenu onClose={() => setOpen(false)} showCreateOrganization={false} {...props} />
      )}
    />
  );
}
