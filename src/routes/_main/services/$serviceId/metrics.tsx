import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: ServiceMetricsPage,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <Crumb to={Route.fullPath} params={params} />,
  }),
});
