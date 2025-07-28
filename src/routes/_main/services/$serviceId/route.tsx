import { Outlet, createFileRoute } from '@tanstack/react-router';

import { ServiceLayout } from 'src/pages/service/service.layout';

export const Route = createFileRoute('/_main/services/$serviceId')({
  component: () => (
    <ServiceLayout>
      <Outlet />
    </ServiceLayout>
  ),
});
