import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { DatabaseRolesPage } from 'src/pages/databases/database/roles/database-roles.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/roles')({
  component: DatabaseRolesPage,

  beforeLoad: ({ location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'database.roles'),
    };
  },
});
