import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, ParsedLocation } from '@tanstack/react-router';

import { ApiError, isAccountLockedError } from 'src/api/api-errors';
import { mapCatalogDatacenter } from 'src/api/mappers/catalog';
import { mapOrganization } from 'src/api/mappers/session';
import { useApiQueryFn } from 'src/api/use-api';
import { redirectToSignIn, setToken } from 'src/application/authentication';
import { useToken } from 'src/application/token';
import { getUrlLatency } from 'src/application/url-latency';
import { MainLayout } from 'src/layouts/main/main-layout';
import { AccountLocked } from 'src/modules/account/account-locked';

export const Route = createFileRoute('/_main')({
  component: function Component() {
    const { locked } = Route.useLoaderData();

    if (locked) {
      return <AccountLocked />;
    }

    return (
      <MainLayout>
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
      await fetchCurrentSession(queryClient, location);
      await fetchCatalog(queryClient);
      await preloadDatacenterLatencies(queryClient);
    } catch (error) {
      if (isAccountLockedError(error)) {
        return { locked: true };
      }

      throw error;
    }

    return {
      locked: false,
    };
  },
});

async function fetchCurrentSession(queryClient: QueryClient, location: ParsedLocation) {
  try {
    const [, organization] = await Promise.all([
      queryClient.ensureQueryData(useApiQueryFn('getCurrentUser')),
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
