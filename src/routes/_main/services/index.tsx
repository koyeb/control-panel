import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { getApi, listAppsFull } from 'src/api';
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

  async loader({ context: { authKit, queryClient } }) {
    const api = getApi(authKit.getAccessToken);

    await queryClient.ensureQueryData({
      queryKey: ['listAppsFull', { api }],
      queryFn: () => listAppsFull(api),
    });
  },
});
