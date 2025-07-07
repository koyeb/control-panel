import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { PlansPage } from 'src/pages/settings/organization/plans/plans.page';

export const Route = createFileRoute('/_main/settings/plans')({
  component: PlansPage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
