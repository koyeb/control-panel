import { createFileRoute } from '@tanstack/react-router';

import { ConfirmDeactivateOrganization } from 'src/modules/account/confirm-deactivate-organization';

export const Route = createFileRoute('/_main/organization/deactivate/confirm/$confirmationId')({
  component: function Component() {
    const { confirmationId } = Route.useParams();

    return <ConfirmDeactivateOrganization confirmationId={confirmationId} />;
  },
});
