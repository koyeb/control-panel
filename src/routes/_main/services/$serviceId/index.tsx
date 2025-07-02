import { createFileRoute } from '@tanstack/react-router';

import { ServiceOverviewPage } from 'src/pages/service/overview/service-overview.page';

export const Route = createFileRoute('/_main/services/$serviceId/')({
  component: ServiceOverviewPage,
});
