import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { CreateDatabasePage } from 'src/pages/databases/create-database.page';

export const Route = createFileRoute('/_main/database-services/new')({
  component: CreateDatabasePage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
