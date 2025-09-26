import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { CreateServicePage } from 'src/pages/service/create-service.page';

export const Route = createFileRoute('/_main/services/new')({
  component: CreateServicePage,

  validateSearch: deployParamsSchema.extend({
    type: z
      .union([z.literal('git'), z.literal('docker'), z.literal('private'), z.literal('model')])
      .optional(),
    step: z
      .union([
        z.literal('serviceType'),
        z.literal('importProject'),
        z.literal('builder'),
        z.literal('instanceRegions'),
        z.literal('review'),
        z.literal('initialDeployment'),
      ])
      .optional(),
    serviceId: z.string().optional(),
  }),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
