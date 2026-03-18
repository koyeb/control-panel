import { QueryClient } from '@tanstack/react-query';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import {
  ApiError,
  createEnsureApiQueryData,
  mapCatalogDatacenter,
  mapOrganization,
  mapUser,
  useOrganizationQuery,
  useUserQuery,
} from 'src/api';
import { getCurrentProjectId, setCurrentProjectId } from 'src/api/hooks/project';
import { AuthKit } from 'src/application/authkit';
import { getConfig } from 'src/application/config';
import { useOnboardingStep } from 'src/application/onboarding';
import { reportError } from 'src/application/sentry';
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

  async beforeLoad({ search, context: { authKit, queryClient, posthog } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    if (search['organization-id']) {
      await switchOrganization(authKit, search['organization-id']);
    }

    const [user, organization] = await Promise.all([
      ensureApiQueryData('get /v1/account/profile', {}).then(({ user }) => mapUser(user!)),
      ensureApiQueryData('get /v1/account/organization', {})
        .then(({ organization }) => mapOrganization(organization!))
        .catch(() => undefined),
    ]);

    let projectId = getCurrentProjectId() ?? undefined;

    if (organization !== undefined) {
      if (projectId === undefined) {
        projectId = organization.defaultProjectId;
        setCurrentProjectId(projectId);
      }

      try {
        await ensureApiQueryData('get /v1/projects/{id}', { path: { id: projectId } });
      } catch (error) {
        if (ApiError.is(error, 404)) {
          projectId = organization.defaultProjectId;
          setCurrentProjectId(projectId);
          await ensureApiQueryData('get /v1/projects/{id}', { path: { id: projectId } });
        } else {
          throw error;
        }
      }
    }

    posthog?.identify(user.id);

    if (organization) {
      posthog?.group('segment_group', organization.id);
    }

    return {
      user,
      organization,
      projectId,
      posthog,
    };
  },

  async loader({ context: { queryClient, organization, seon } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    seon.initialize(queryClient).catch(reportError);
    void preloadDatacentersLatencies(queryClient);

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

      promises.add(
        ensureApiQueryData('get /v1/account/organizations', {
          query: {
            limit: '10',
            statuses: ['ACTIVE', 'WARNING', 'LOCKED', 'DEACTIVATING', 'DEACTIVATED'],
          },
        }),
      );

      promises.add(
        ensureApiQueryData('get /v1/organization_members', {
          query: { limit: '10' },
        }),
      );

      promises.add(
        ensureApiQueryData('get /v1/projects', {
          query: { limit: '10' },
        }),
      );
    }

    await Promise.all(promises);
  },
});

async function switchOrganization(authKit: AuthKit, externalId: string) {
  await authKit.switchToOrganization({ organizationId: externalId });

  throw redirect({
    search: (prev) => ({ ...prev, 'organization-id': undefined }),
  });
}

async function preloadDatacentersLatencies(queryClient: QueryClient) {
  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  const datacenters = await ensureApiQueryData('get /v1/catalog/datacenters', {}).then((result) =>
    result.datacenters!.map(mapCatalogDatacenter),
  );

  if (getConfig('environment') !== 'production') {
    return;
  }

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
