import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: function Component() {
    const { serviceId } = Route.useParams();
    const { 'time-frame': timeFrame } = Route.useSearch();

    return <ServiceMetricsPage serviceId={serviceId} timeFrame={timeFrame} />;
  },

  validateSearch: z.object({
    'time-frame': z
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

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} params={params} />,
  }),
});
