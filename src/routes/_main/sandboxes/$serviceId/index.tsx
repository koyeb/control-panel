import { createFileRoute } from '@tanstack/react-router';

import { SandboxDetails } from 'src/modules/sandbox/sandbox-details';

export const Route = createFileRoute('/_main/sandboxes/$serviceId/')({
  component: function Component() {
    const { serviceId } = Route.useParams();

    return <SandboxDetails serviceId={serviceId} />;
  },
});
