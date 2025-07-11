import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { OneClickAppsPage } from 'src/pages/one-click-apps/one-click-apps.page';

export const Route = createFileRoute('/_main/one-click-apps')({
  component: OneClickAppsPage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
