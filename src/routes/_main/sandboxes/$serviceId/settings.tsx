import { createFileRoute } from '@tanstack/react-router';

import { SandboxSettingsForm } from 'src/modules/sandbox/details/sandbox-settings-form';

export const Route = createFileRoute('/_main/sandboxes/$serviceId/settings')({
  component: function Component() {
    const { serviceId } = Route.useParams();

    return <SandboxSettingsForm serviceId={serviceId} />;
  },
});
