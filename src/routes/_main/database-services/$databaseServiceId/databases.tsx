import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { LogicalDatabasesPage } from 'src/pages/databases/database/logical-databases/logical-databases.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/databases')({
  component: LogicalDatabasesPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'database.databases');
  },
});
