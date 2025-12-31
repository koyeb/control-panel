import { Spinner } from '@koyeb/design-system';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useRef } from 'react';
import z from 'zod';

import {
  ApiError,
  apiQuery,
  createEnsureApiQueryData,
  getApi,
  mapCatalogDatacenter,
  mapOrganization,
  useOrganizationQuery,
  useUserQuery,
} from 'src/api';
import { AuthKit } from 'src/application/authkit';
import { useOnboardingStep } from 'src/application/onboarding';
import { setToken } from 'src/application/token';
import { getUrlLatency } from 'src/application/url-latency';
import { LogoLoading } from 'src/components/logo-loading';
import { isFeatureFlagEnabled } from 'src/hooks/feature-flag';
import { Translate } from 'src/intl/translate';
import { MainLayout } from 'src/layouts/main/main-layout';
import { FullScreenLayout } from 'src/layouts/onboarding/full-screen-layout';
import { AccountLocked } from 'src/modules/account/account-locked';
import { TrialEnded } from 'src/modules/trial/trial-ended/trial-ended';
import { useTrial } from 'src/modules/trial/use-trial';
import { OnboardingPage } from 'src/pages/onboarding/onboarding.page';
import { waitFor } from 'src/utils/promises';

export const Route = createFileRoute('/_main')({
  component: Component,
  pendingComponent: PendingComponent,

  validateSearch: z.object({
    'session-token': z.string().optional(),
    'organization-id': z.string().optional(),
    settings: z.literal('true').optional(),
  }),

  async beforeLoad({ search, context: { authKit, queryClient } }) {
    if (search['session-token'] !== undefined) {
      setToken(search['session-token'].replace(/^Bearer /, ''), true);
      throw redirect({ search: (prev) => ({ ...prev, 'session-token': undefined }) });
    }

    if (search['organization-id']) {
      await switchOrganization(authKit, search['organization-id']);
    }

    await waitFor(() => isUserAvailable(authKit, queryClient), { interval: 2_000 });
  },

  async loader({ context: { queryClient, seon } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    void preloadDatacentersLatencies(queryClient);

    await queryClient.fetchQuery(
      apiQuery('get /v1/account/profile', {
        header: { 'seon-fp': await seon.getFingerprint() },
      }),
    );

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

async function switchOrganization(authKit: AuthKit, organizationId: string) {
  const api = getApi();

  if (organizationId.startsWith('org_') && (await isFeatureFlagEnabled('workos-switch-organization'))) {
    await authKit.switchToOrganization({ organizationId });
  } else {
    await api('post /v1/organizations/{id}/switch', { path: { id: organizationId }, header: {} });
  }

  throw redirect({
    search: (prev) => ({ ...prev, 'organization-id': undefined }),
    reloadDocument: true,
  });
}

function PendingComponent() {
  const userQuery = useQuery(apiQuery('get /v1/account/profile', {}));
  const isUserAvailable = useRef(true);

  if (userQuery.isSuccess) {
    isUserAvailable.current = true;
  } else if (ApiError.is(userQuery.error, 404)) {
    isUserAvailable.current = false;
  }

  if (!isUserAvailable.current) {
    return <CreatingAccount />;
  }

  return <LogoLoading />;
}

function CreatingAccount() {
  return (
    <FullScreenLayout>
      <Spinner className="size-8" />

      <div className="mt-6 mb-2 text-xl">
        <Translate id="layouts.main.creatingAccount.title" />
      </div>

      <div className="text-lg text-dim">
        <Translate id="layouts.main.creatingAccount.description" />
      </div>
    </FullScreenLayout>
  );
}

async function isUserAvailable(authKit: AuthKit, queryClient: QueryClient) {
  try {
    await authKit.getAccessToken();
    await queryClient.fetchQuery(apiQuery('get /v1/account/profile', {}));
  } catch (error) {
    if (ApiError.is(error, 404)) {
      return false;
    }
  }

  return true;
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
