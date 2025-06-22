import { createFileRoute } from '@tanstack/react-router';
import { deployParams } from 'src/application/deploy-params';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { DeployPage } from 'src/pages/service/deploy/deploy.page';
import { z } from 'zod';

export const Route = createFileRoute('/_main/services/deploy')({
  component: DeployPage,

  validateSearch: deployParams.extend({
    one_click_app: z.string().optional(),
    model: z.string().optional(),
  }),

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'deploy');
  },
});
