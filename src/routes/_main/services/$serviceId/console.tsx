import { createFileRoute } from '@tanstack/react-router';

import { ServiceConsolePage } from 'src/pages/service/console/service-console.page';

export const Route = createFileRoute('/_main/services/$serviceId/console')({
  component: ServiceConsolePage,
});
