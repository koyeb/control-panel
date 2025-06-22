import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { DeployPage } from 'src/pages/service/deploy/deploy.page';

export const Route = createFileRoute('/_main/services/deploy')({
  component: DeployPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'deploy');
  },
});
