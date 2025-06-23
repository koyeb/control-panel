import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceConsolePage } from 'src/pages/service/console/service-console.page';

export const Route = createFileRoute('/_main/services/$serviceId/console')({
  component: ServiceConsolePage,

  beforeLoad: ({ context, location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'service.console'),
    };
  },
});
