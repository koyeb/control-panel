import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppServiceCrumb } from 'src/layouts/main/app-breadcrumbs';
import { DatabaseLayout } from 'src/pages/databases/database/database.layout';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId')({
  component: () => (
    <DatabaseLayout>
      <Outlet />
    </DatabaseLayout>
  ),

  loader: ({ context, params }) => {
    context.breadcrumb = {
      label: () => <AppServiceCrumb serviceId={params.databaseServiceId} />,
      link: `/database-services/${params.databaseServiceId}`,
    };
  },
});
