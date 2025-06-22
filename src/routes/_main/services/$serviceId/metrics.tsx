import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ServiceMetricsPage } from 'src/pages/service/metrics/service-metrics.page';

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: ServiceMetricsPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'service.metrics');
  },
});
