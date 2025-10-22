import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { listAppsFull } from 'src/api';
import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { AppsServicesList } from 'src/modules/services-list/apps-services-list';

export const Route = createFileRoute('/_main/services/')({
  component: AppsServicesList,

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
  }),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),

  async loader({ context: { queryClient } }) {
    await queryClient.ensureQueryData({
      queryKey: ['listAppsFull'],
      queryFn: () => listAppsFull(),
    });
  },
});
