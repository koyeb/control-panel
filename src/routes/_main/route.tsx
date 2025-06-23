import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, ParsedLocation, useMatches } from '@tanstack/react-router';

import { ApiError, isAccountLockedError } from 'src/api/api-errors';
import { mapCatalogDatacenter } from 'src/api/mappers/catalog';
import { mapOrganization, mapUser } from 'src/api/mappers/session';
import { useApiQueryFn } from 'src/api/use-api';
import { redirectToSignIn, setToken } from 'src/application/authentication';
import { getOnboardingStep } from 'src/application/onboarding';
import { IdentifyUser } from 'src/application/posthog';
import { useToken } from 'src/application/token';
import { getUrlLatency } from 'src/application/url-latency';
import { MainLayout } from 'src/layouts/main/main-layout';
import { AccountLocked } from 'src/modules/account/account-locked';
import { OnboardingPage } from 'src/pages/onboarding/onboarding.page';

export const Route = createFileRoute('/_main')({
  component: function Component() {
    const { locked, onboardingStep } = Route.useLoaderData();

    const matchConfirmDeactivateOrganization = useMatches().find(
      (route) => route.routeId === '/_main/organization/deactivate/confirm/$confirmationId',
    );

    if (locked) {
      return <AccountLocked />;
    }

    if (matchConfirmDeactivateOrganization) {
      return <Outlet />;
    }

    if (onboardingStep !== null) {
      return <OnboardingPage step={onboardingStep} />;
    }

    return (
      <MainLayout>
        <IdentifyUser />
        <Outlet />
      </MainLayout>
    );
  },

  beforeLoad: ({ location }) => {
    if (!useToken().token) {
      redirectToSignIn(location);
    }
  },

  loader: async ({ context, location }) => {
    const { queryClient } = context;

    try {
      const { user, organization } = await fetchCurrentSession(queryClient, location);

      await Promise.all([fetchCatalog(queryClient), preloadDatacenterLatencies(queryClient)]);

      return {
        locked: false,
        onboardingStep: getOnboardingStep(user, organization),
      };
    } catch (error) {
      if (isAccountLockedError(error)) {
        return { locked: true, onboardingStep: null };
      }

      throw error;
    }
  },
});

async function fetchCurrentSession(queryClient: QueryClient, location: ParsedLocation) {
  try {
    const [user, organization] = await Promise.all([
      queryClient.ensureQueryData(useApiQueryFn('getCurrentUser')).then(({ user }) => mapUser(user!)),
      queryClient
        .ensureQueryData(useApiQueryFn('getCurrentOrganization'))
        .then(({ organization }) => mapOrganization(organization!))
        .catch((error) => {
          if (error instanceof ApiError && error.status === 404) {
            return null;
          }

          throw error;
        }),
    ]);

    if (organization) {
      if (organization.statusMessage === 'VERIFICATION_FAILED') {
        throw { status: 403, message: 'Account is locked' };
      }

      const queries = new Array<ReturnType<typeof useApiQueryFn>>();

      if (organization.latestSubscriptionId) {
        queries.push(useApiQueryFn('getSubscription', { path: { id: organization.latestSubscriptionId } }));
      }

      if (organization) {
        queries.push(useApiQueryFn('organizationSummary', { path: { organization_id: organization.id } }));
        queries.push(useApiQueryFn('organizationQuotas', { path: { organization_id: organization.id } }));
      }

      await Promise.all(queries.map((query) => queryClient.ensureQueryData(query)));
    }

    return {
      user,
      organization,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setToken(null);
      redirectToSignIn(location);
    }

    throw error;
  }
}

async function fetchCatalog(queryClient: QueryClient) {
  await Promise.all([
    queryClient.ensureQueryData(useApiQueryFn('listCatalogDatacenters')),
    queryClient.ensureQueryData(useApiQueryFn('listCatalogRegions')),
    queryClient.ensureQueryData(useApiQueryFn('listCatalogInstances')),
  ]);
}

async function preloadDatacenterLatencies(queryClient: QueryClient) {
  const datacenters = await queryClient
    .ensureQueryData(useApiQueryFn('listCatalogDatacenters'))
    .then(({ datacenters }) => datacenters!.map(mapCatalogDatacenter));

  const urls = datacenters
    .filter(({ id }) => !id.includes('aws'))
    .map((datacenter) => `https://${datacenter.domain}/health`);

  await Promise.all(
    urls.map((url) =>
      queryClient.ensureQueryData({
        queryKey: ['datacenterLatency', url],
        queryFn: () => getUrlLatency(url),
      }),
    ),
  );
}
