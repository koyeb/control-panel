import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { HomePage } from 'src/pages/home/home.page';

export const Route = createFileRoute('/_main/')({
  component: HomePage,

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
});
