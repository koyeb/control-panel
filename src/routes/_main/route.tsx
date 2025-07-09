import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { api } from 'src/api/api';
import { isAccountLockedError } from 'src/api/api-errors';
import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { useOnboardingStep } from 'src/application/onboarding';
import { MainLayout } from 'src/layouts/main/main-layout';
import { SecondarySettings } from 'src/layouts/secondary/settings';
import { AccountLocked } from 'src/modules/account/account-locked';
import { TrialEnded } from 'src/modules/trial/trial-ended/trial-ended';
import { useTrial } from 'src/modules/trial/use-trial';
import { OnboardingPage } from 'src/pages/onboarding/onboarding.page';

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

async function switchOrganization(
  token: string,
  setToken: (token: string) => Promise<void>,
  organizationId: string,
) {
  const result = await api.switchOrganization({
    path: { id: organizationId },
    header: {},
  });

  await setToken(result.token!.id!);

  throw redirect({
    search: (prev) => ({ ...prev, 'organization-id': undefined }),
    reloadDocument: true,
  });
}

function Component() {
  const { settings } = Route.useSearch();

  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  const trial = useTrial();
  const onboardingStep = useOnboardingStep();

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

  if (trial?.ended) {
    return <TrialEnded />;
  }

  if (onboardingStep) {
    return <OnboardingPage step={onboardingStep} />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
