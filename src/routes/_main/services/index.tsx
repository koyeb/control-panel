import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServicesPage } from 'src/pages/home/services.page';

export const Route = createFileRoute('/_main/services/')({
  component: ServicesPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'services');
  },
});
