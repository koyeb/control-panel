import { createFileRoute } from '@tanstack/react-router';
import { ServiceOverviewPage } from 'src/pages/service/overview/service-overview.page';
import { z } from 'zod';

export const Route = createFileRoute('/_main/services/$serviceId/')({
  component: ServiceOverviewPage,

  validateSearch: z.object({
    deploymentId: z.string().optional(),
  }),
});
