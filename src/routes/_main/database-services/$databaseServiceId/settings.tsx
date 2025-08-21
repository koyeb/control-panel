import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { DatabaseSettingsPage } from 'src/pages/databases/database/settings/database-settings.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/settings')({
  component: DatabaseSettingsPage,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} params={params} />,
  }),
});
