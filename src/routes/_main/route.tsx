import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router';
import { isAfter, sub } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { api } from 'src/api/api';

import { isAccountLockedError } from 'src/api/api-errors';
import { getCurrentOrganization } from 'src/api/hooks/session';
import { mapCatalogDatacenter } from 'src/api/mappers/catalog';
import { mapOrganization, mapUser } from 'src/api/mappers/session';
import { apiQueryFn } from 'src/api/use-api';
import { getToken, isAuthenticated, isSessionToken, setToken } from 'src/application/authentication';
import { getOnboardingStep } from 'src/application/onboarding';
import { IdentifyUser } from 'src/application/posthog';
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

  beforeLoad: ({ context, location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: '/auth/signin',
        replace: true,
        search: {
          next: location.href !== '/' ? location.href : undefined,
        },
      });
    }

    return fetchCurrentSession(context.queryClient);
  },

  loader: async ({ context }) => {
    const { user, organization, queryClient } = context;

    try {
      await Promise.all([refreshToken(), fetchCatalog(queryClient), preloadDatacenterLatencies(queryClient)]);

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

async function refreshToken() {
  const token = getToken();
  const exp = token ? jwtDecode(token).exp : null;
  const expires = exp ? new Date(exp * 1000) : null;

  if (expires && isAfter(new Date(), sub(expires, { hours: 12 })) && !isSessionToken()) {
    const { token } = await api.refreshToken({});
    setToken(token!.id!);
  }
}

async function fetchCurrentSession(queryClient: QueryClient) {
  const [user, organization] = await Promise.all([
    queryClient.ensureQueryData(apiQueryFn('getCurrentUser')).then(({ user }) => mapUser(user!)),
    queryClient
      .ensureQueryData({ ...apiQueryFn('getCurrentOrganization'), queryFn: getCurrentOrganization })
      .then(({ organization }) => {
        if (organization === null) {
          return null;
        }

        return mapOrganization(organization!);
      }),
  ]);

  if (organization) {
    if (organization.statusMessage === 'VERIFICATION_FAILED') {
      throw { status: 403, message: 'Account is locked' };
    }

    const queries = new Array<ReturnType<typeof apiQueryFn>>();

    if (organization.latestSubscriptionId) {
      queries.push(apiQueryFn('getSubscription', { path: { id: organization.latestSubscriptionId } }));
    }

    if (organization) {
      queries.push(apiQueryFn('organizationSummary', { path: { organization_id: organization.id } }));
      queries.push(apiQueryFn('organizationQuotas', { path: { organization_id: organization.id } }));
    }

    await Promise.all(queries.map((query) => queryClient.ensureQueryData(query)));
  }

  return {
    user,
    organization,
  };
}

async function fetchCatalog(queryClient: QueryClient) {
  await Promise.all([
    queryClient.ensureQueryData(apiQueryFn('listCatalogDatacenters')),
    queryClient.ensureQueryData(apiQueryFn('listCatalogRegions')),
    queryClient.ensureQueryData(apiQueryFn('listCatalogInstances')),
  ]);
}

async function preloadDatacenterLatencies(queryClient: QueryClient) {
  const datacenters = await queryClient
    .ensureQueryData(apiQueryFn('listCatalogDatacenters'))
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
