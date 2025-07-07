import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { CreateServicePage } from 'src/pages/service/create-service.page';

export const Route = createFileRoute('/_main/services/new')({
  component: CreateServicePage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
