import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { ActivityPage } from 'src/pages/activity/activity.page';

export const Route = createFileRoute('/_main/activity')({
  component: ActivityPage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
