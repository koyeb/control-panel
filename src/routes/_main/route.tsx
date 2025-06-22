import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, ParsedLocation } from '@tanstack/react-router';

import { ApiError } from 'src/api/api-errors';
import { mapCatalogDatacenter } from 'src/api/mappers/catalog';
import { mapOrganization } from 'src/api/mappers/session';
import { useApiQueryFn } from 'src/api/use-api';
import { redirectToSignIn, setToken } from 'src/application/authentication';
import { useToken } from 'src/application/token';
import { getUrlLatency } from 'src/application/url-latency';
import { MainLayout } from 'src/layouts/main/main-layout';

export const Route = createFileRoute('/_main')({
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),

  beforeLoad: ({ location }) => {
    if (!useToken().token) {
      redirectToSignIn(location);
    }
  },

  loader: async ({ context, location }) => {
    const { queryClient } = context;

    await fetchCurrentSession(queryClient, location);
    await fetchCatalog(queryClient);
    await preloadDatacenterLatencies(queryClient);
  },
});

async function fetchCurrentSession(queryClient: QueryClient, location: ParsedLocation) {
  try {
    const [, organization] = await Promise.all([
      queryClient.ensureQueryData(useApiQueryFn('getCurrentUser')),
      queryClient
        .ensureQueryData(useApiQueryFn('getCurrentOrganization'))
        .then((organization) => mapOrganization(organization.organization!)),
    ]);

    const promises = new Array<Promise<unknown>>();

    const query = (...params: Parameters<typeof useApiQueryFn>) => {
      promises.push(queryClient.ensureQueryData(useApiQueryFn(...params)));
    };

    if (organization.latestSubscriptionId) {
      query('getSubscription', { path: { id: organization.latestSubscriptionId } });
    }

    if (organization) {
      query('organizationSummary', { path: { organization_id: organization.id } });
      query('organizationQuotas', { path: { organization_id: organization.id } });
    }

    await Promise.all(promises);
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
  const datacenters = await queryClient.ensureQueryData(useApiQueryFn('listCatalogDatacenters'));

  const urls = datacenters
    .datacenters!.map(mapCatalogDatacenter)
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
