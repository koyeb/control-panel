import { createFileRoute } from '@tanstack/react-router';

import { OverviewPage } from 'src/pages/databases/database/overview/overview.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/')({
  component: OverviewPage,
});
