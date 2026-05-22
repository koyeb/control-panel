import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { metricsSteps, metricsTimeFrames } from 'src/modules/metrics/metrics-helpers';
import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: function Component() {
    const { serviceId } = Route.useParams();
    const { 'time-frame': timeFrame, step } = Route.useSearch();

    return <ServiceMetricsPage serviceId={serviceId} timeFrame={timeFrame} step={step} />;
  },

  validateSearch: z.object({
    'time-frame': z.enum(metricsTimeFrames).default('5m').catch('5m'),
    step: z.enum(metricsSteps).optional().catch(undefined),
  }),

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.to} params={params} />,
  }),
});
