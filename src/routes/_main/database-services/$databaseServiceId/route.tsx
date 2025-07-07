import { Outlet, createFileRoute } from '@tanstack/react-router';

import { AppServiceCrumb } from 'src/layouts/main/app-breadcrumbs';
import { DatabaseLayout } from 'src/pages/databases/database/database.layout';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId')({
  component: () => (
    <DatabaseLayout>
      <Outlet />
    </DatabaseLayout>
  ),

  beforeLoad: ({ params }) => ({
    breadcrumb: () => (
      <AppServiceCrumb serviceId={params.databaseServiceId} link={{ to: Route.fullPath, params }} />
    ),
  }),
});
