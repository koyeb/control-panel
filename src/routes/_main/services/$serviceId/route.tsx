import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppServiceCrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceLayout } from 'src/pages/service/service.layout';

export const Route = createFileRoute('/_main/services/$serviceId')({
  component: () => (
    <ServiceLayout>
      <Outlet />
    </ServiceLayout>
  ),

  loader: ({ context, params }) => {
    context.breadcrumb = {
      label: () => <AppServiceCrumb serviceId={params.serviceId} />,
      link: `/services/${params.serviceId}`,
    };
  },
});
