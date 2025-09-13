import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { ServiceSettingsPage } from 'src/pages/service/settings/service-settings.page';

export const Route = createFileRoute('/_main/services/$serviceId/settings')({
  component: ServiceSettingsPage,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} params={params} />,
  }),
});
