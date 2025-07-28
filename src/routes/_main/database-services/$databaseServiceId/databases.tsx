import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { LogicalDatabasesPage } from 'src/pages/databases/database/logical-databases/logical-databases.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/databases')({
  component: LogicalDatabasesPage,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} params={params} />,
  }),
});
