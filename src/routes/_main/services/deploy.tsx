import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { DeployPage } from 'src/pages/service/deploy/deploy.page';

export const Route = createFileRoute('/_main/services/deploy')({
  component: DeployPage,

  validateSearch: deployParamsSchema.extend({
    'duplicate-service-id': z.string().optional(),
  }),
});
