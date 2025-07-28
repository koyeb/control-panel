import { Outlet, createFileRoute } from '@tanstack/react-router';

import { DatabaseLayout } from 'src/pages/databases/database/database.layout';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId')({
  component: () => (
    <DatabaseLayout>
      <Outlet />
    </DatabaseLayout>
  ),
});
