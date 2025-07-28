import { createFileRoute } from '@tanstack/react-router';

import { DatabaseRolesPage } from 'src/pages/databases/database/roles/database-roles.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/roles')({
  component: DatabaseRolesPage,
});
