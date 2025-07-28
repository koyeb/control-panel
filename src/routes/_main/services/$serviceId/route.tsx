import { Outlet, createFileRoute } from '@tanstack/react-router';

import { AppServiceCrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceLayout } from 'src/pages/service/service.layout';

export const Route = createFileRoute('/_main/services/$serviceId')({
  component: () => (
    <ServiceLayout>
      <Outlet />
    </ServiceLayout>
  ),

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <AppServiceCrumb serviceId={params.serviceId} link={{ to: Route.fullPath, params }} />,
  }),
});
