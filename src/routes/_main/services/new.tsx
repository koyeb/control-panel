import { createFileRoute, redirect } from '@tanstack/react-router';
import { deployParams } from 'src/application/deploy-params';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { CreateServicePage } from 'src/pages/service/create-service.page';
import { z } from 'zod';

export const Route = createFileRoute('/_main/services/new')({
  component: CreateServicePage,

  validateSearch: deployParams.extend({
    step: z
      .union([
        z.literal('serviceType'),
        z.literal('importProject'),
        z.literal('instanceRegions'),
        z.literal('review'),
        z.literal('initialDeployment'),
      ])
      .default('serviceType'),
  }),

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'createService');

    if (!('service_type' in location.search)) {
      throw redirect({ from: Route.fullPath, search: { ...location.search, service_type: 'web' } });
    }
  },
});
