import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { isAccountLockedError } from 'src/api/api-errors';
import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { mapCatalogDatacenter } from 'src/api/mappers/catalog';
import { mapOrganization, mapUser } from 'src/api/mappers/session';
import { createEnsureApiQueryData } from 'src/api/use-api';
import { container, getApi } from 'src/application/container';
import { getOnboardingStep, useOnboardingStep } from 'src/application/onboarding';
import { getUrlLatency } from 'src/application/url-latency';
import { MainLayout } from 'src/layouts/main/main-layout';
import { SecondarySettings } from 'src/layouts/secondary/settings';
import { AccountLocked } from 'src/modules/account/account-locked';
import { TrialEnded } from 'src/modules/trial/trial-ended/trial-ended';
import { useTrial } from 'src/modules/trial/use-trial';
import { OnboardingPage } from 'src/pages/onboarding/onboarding.page';
import { TOKENS } from 'src/tokens';

export const Route = createFileRoute('/_main')({
  component: Component,

  validateSearch: z.object({
    'organization-id': z.string().optional(),
    settings: z.literal('true').optional(),
  }),

  async beforeLoad({ location, search }) {
    const auth = container.resolve(TOKENS.authentication);

    if (auth.token === null) {
      const next = location.pathname !== '/' ? location.href : undefined;

      throw redirect({
        to: '/auth/signin',
        search: { next },
      });
    }

    if (search['organization-id']) {
      await switchOrganization(search['organization-id']);
    }
  },

  async loader({ context: { queryClient }, location, abortController }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient, abortController);

    const user = await ensureApiQueryData('getCurrentUser', {}).then((result) => mapUser(result.user!));

    const organization = await ensureApiQueryData('getCurrentOrganization', {}).then(
      (result) => mapOrganization(result.organization!),
      () => undefined,
    );

    if (getOnboardingStep(user, organization) !== null && location.pathname !== '/') {
      throw redirect({ to: '/' });
    }

    const promises = new Set<Promise<unknown>>();

    promises.add(ensureApiQueryData('listCatalogRegions', { query: { limit: '100' } }));
    promises.add(ensureApiQueryData('listCatalogInstances', { query: { limit: '100' } }));

    if (organization && organization.status === 'ACTIVE') {
      promises.add(ensureApiQueryData('organizationSummary', { path: { organization_id: organization.id } }));
      promises.add(ensureApiQueryData('organizationQuotas', { path: { organization_id: organization.id } }));

      if (organization.latestSubscriptionId) {
        promises.add(
          ensureApiQueryData('getSubscription', { path: { id: organization.latestSubscriptionId } }),
        );
      }
    }

    await Promise.all(promises);

    const datacenters = await ensureApiQueryData('listCatalogDatacenters', {}).then((result) =>
      result.datacenters!.map(mapCatalogDatacenter),
    );

    await Promise.all(
      datacenters.map(async ({ id, domain }) => {
        if (id.includes('aws')) {
          return;
        }

        const url = `https://${domain}/health`;

        await queryClient.ensureQueryData({
          queryKey: ['datacenterLatency', url],
          queryFn: () => getUrlLatency(url),
        });
      }),
    );
  },
});

async function switchOrganization(organizationId: string) {
  const auth = container.resolve(TOKENS.authentication);

  const result = await getApi().switchOrganization({
    path: { id: organizationId },
    token: auth.token,
    header: {},
  });

  auth.setToken(result.token!.id!);

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

  if (settings) {
    return <SecondarySettings />;
  }

  if (locked) {
    return <AccountLocked />;
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
