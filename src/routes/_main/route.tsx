import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { api } from 'src/api/api';
import { isAccountLockedError } from 'src/api/api-errors';
import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { MainLayout } from 'src/layouts/main/main-layout';
import { SecondarySettings } from 'src/layouts/secondary/settings';
import { AccountLocked } from 'src/modules/account/account-locked';

export const Route = createFileRoute('/_main')({
  component: Component,

  validateSearch: z.object({
    'organization-id': z.string().optional(),
    settings: z.boolean().optional(),
  }),

  async beforeLoad({ location, search, context }) {
    const { auth } = context;

    if (auth.token === null) {
      const next = location.pathname !== '/' ? location.href : undefined;

      throw redirect({
        to: '/auth/signin',
        search: { next },
      });
    }

    if (search['organization-id']) {
      await switchOrganization(auth.token, auth.setToken, search['organization-id']);
    }
  },
});

async function switchOrganization(token: string, setToken: (token: string) => void, organizationId: string) {
  const result = await api.switchOrganization({
    token,
    path: { id: organizationId },
    header: {},
  });

  setToken(result.token!.id!);

  throw redirect({
    search: (prev) => ({ ...prev, 'organization-id': undefined }),
    reloadDocument: true,
  });
}

function Component() {
  const { settings } = Route.useSearch();

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

  if (settings) {
    return <SecondarySettings />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
