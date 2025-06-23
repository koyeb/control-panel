import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { ApiError } from 'src/api/api-errors';
import { apiQueryFn } from 'src/api/use-api';
import { AppServiceCrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceLayout } from 'src/pages/service/service.layout';

export const Route = createFileRoute('/_main/services/$serviceId')({
  component: () => (
    <ServiceLayout>
      <Outlet />
    </ServiceLayout>
  ),

  notFoundComponent: () => <>Service not found.</>,

  beforeLoad: ({ params }) => {
    return {
      breadcrumb: {
        label: () => <AppServiceCrumb serviceId={params.serviceId} />,
        link: `/services/${params.serviceId}`,
      },
    };
  },

  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(apiQueryFn('getService', { path: { id: params.serviceId } }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
});
