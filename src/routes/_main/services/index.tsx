import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServicesPage } from 'src/pages/home/services.page';

export const Route = createFileRoute('/_main/services/')({
  component: ServicesPage,

  beforeLoad: ({ location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'services'),
    };
  },
});
