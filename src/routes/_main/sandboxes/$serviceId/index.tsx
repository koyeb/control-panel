import { createFileRoute } from '@tanstack/react-router';

import { useServiceQuery } from 'src/api';
import { QueryGuard } from 'src/components/query-error';
import { SandboxDetails } from 'src/modules/sandbox/details/sandbox-details';

export const Route = createFileRoute('/_main/sandboxes/$serviceId/')({
  component: SandboxDetailsRoute,
});

function SandboxDetailsRoute() {
  const { serviceId } = Route.useParams();
  const serviceQuery = useServiceQuery(serviceId);

  return <QueryGuard query={serviceQuery}>{(service) => <SandboxDetails service={service} />}</QueryGuard>;
}
