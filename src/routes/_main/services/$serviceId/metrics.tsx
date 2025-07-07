import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: Component,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <Crumb to={Route.fullPath} params={params} />,
  }),

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
});

function Component() {
  const { serviceId } = Route.useParams();
  const { 'time-frame': timeFrame } = Route.useSearch();

  return <ServiceMetricsPage serviceId={serviceId} timeFrame={timeFrame} />;
}
