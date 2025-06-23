import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';
import { z } from 'zod';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: ServiceMetricsPage,

  validateSearch: z.object({
    timeFrame: z
      .union([
        z.literal('5m'),
        z.literal('15m'),
        z.literal('1h'),
        z.literal('6h'),
        z.literal('1d'),
        z.literal('2d'),
        z.literal('7d'),
      ])
      .default('5m'),
  }),

  beforeLoad: ({ context, location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'service.metrics'),
    };
  },
});
