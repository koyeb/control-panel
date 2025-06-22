import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { CreateServicePage } from 'src/pages/service/create-service.page';

export const Route = createFileRoute('/_main/services/new')({
  component: CreateServicePage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'createService');
  },
});
