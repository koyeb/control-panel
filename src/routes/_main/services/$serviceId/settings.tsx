import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceSettingsPage } from 'src/pages/service/settings/service-settings.page';

export const Route = createFileRoute('/_main/services/$serviceId/settings')({
  component: ServiceSettingsPage,

  beforeLoad: ({ location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'service.settings'),
    };
  },
});
