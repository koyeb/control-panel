import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { isAccountLockedError } from 'src/api/api-errors';
import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { MainLayout } from 'src/layouts/main/main-layout';
import { AccountLocked } from 'src/modules/account/account-locked';

export const Route = createFileRoute('/_main')({
  component: Component,

  beforeLoad({ location, context }) {
    const { auth } = context;

    if (auth.token === null) {
      const next = location.pathname !== '/' ? location.href : undefined;

      throw redirect({
        to: '/auth/signin',
        search: { next },
      });
    }
  },
});

function Component() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  const locked = [
    isAccountLockedError(userQuery.error),
    isAccountLockedError(organizationQuery.error),
    organizationQuery.data?.statusMessage === 'VERIFICATION_FAILED',
  ].some(Boolean);

  if (locked) {
    return <AccountLocked />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
