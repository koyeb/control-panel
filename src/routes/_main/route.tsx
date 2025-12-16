import { QueryClient } from '@tanstack/react-query';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import {
  ApiError,
  createEnsureApiQueryData,
  getApi,
  mapCatalogDatacenter,
  mapOrganization,
  mapUser,
  useOrganizationQuery,
  useUserQuery,
} from 'src/api';
import { useOnboardingStep } from 'src/application/onboarding';
import { getToken } from 'src/application/token';
import { getUrlLatency } from 'src/application/url-latency';
import { MainLayout } from 'src/layouts/main/main-layout';
import { AccountLocked } from 'src/modules/account/account-locked';
import { TrialEnded } from 'src/modules/trial/trial-ended/trial-ended';
import { useTrial } from 'src/modules/trial/use-trial';
import { OnboardingPage } from 'src/pages/onboarding/onboarding.page';

export const Route = createFileRoute('/_main')({
  component: Component,

  validateSearch: z.object({
    'organization-id': z.string().optional(),
    settings: z.literal('true').optional(),
  }),

  async beforeLoad({ location, search }) {
    const token = await getToken();

    if (token === null) {
      throw redirect({
        to: '/auth/signin',
        search: {
          next: location.pathname !== '/' ? location.href : undefined,
        },
      });
    }

    if (search['organization-id']) {
      await switchOrganization(search['organization-id']);
    }
  },

  async loader({ context: { queryClient, seon } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    void preloadDatacentersLatencies(queryClient);

    await ensureApiQueryData('get /v1/account/profile', {
      header: { 'seon-fp': await seon.getFingerprint() },
    }).then((result) => mapUser(result.user!));

    const organization = await ensureApiQueryData('get /v1/account/organization', {}).then(
      (result) => mapOrganization(result.organization!),
      () => undefined,
    );

    const promises = new Set<Promise<unknown>>();

    promises.add(ensureApiQueryData('get /v1/catalog/regions', { query: { limit: '100' } }));
    promises.add(ensureApiQueryData('get /v1/catalog/instances', { query: { limit: '100' } }));

    if (organization && organization.status === 'ACTIVE') {
      promises.add(
        ensureApiQueryData('get /v1/organizations/{organization_id}/summary', {
          path: { organization_id: organization.id },
        }),
      );
      promises.add(
        ensureApiQueryData('get /v1/organizations/{organization_id}/quotas', {
          path: { organization_id: organization.id },
        }),
      );

      if (organization.latestSubscriptionId) {
        promises.add(
          ensureApiQueryData('get /v1/subscriptions/{id}', {
            path: { id: organization.latestSubscriptionId },
          }),
        );
      }
    }

    await Promise.all(promises);
  },
});

async function switchOrganization(organizationId: string) {
  const api = getApi();

  await api('post /v1/organizations/{id}/switch', {
    path: { id: organizationId },
    header: {},
  });

  throw redirect({
    search: (prev) => ({ ...prev, 'organization-id': undefined }),
    reloadDocument: true,
  });
}

async function preloadDatacentersLatencies(queryClient: QueryClient) {
  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  const datacenters = await ensureApiQueryData('get /v1/catalog/datacenters', {}).then((result) =>
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
}

function Component() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  const trial = useTrial();
  const onboardingStep = useOnboardingStep();

  const locked = [
    ApiError.isAccountLockedError(userQuery.error),
    ApiError.isAccountLockedError(organizationQuery.error),
    organizationQuery.data?.statusMessage === 'VERIFICATION_FAILED',
  ].some(Boolean);

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
