import { createFileRoute } from '@tanstack/react-router';

import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: ServiceMetricsPage,
});
