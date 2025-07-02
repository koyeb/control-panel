import { createFileRoute } from '@tanstack/react-router';

import { LogicalDatabasesPage } from 'src/pages/databases/database/logical-databases/logical-databases.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/databases')({
  component: LogicalDatabasesPage,
});
