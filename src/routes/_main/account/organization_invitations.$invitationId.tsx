import { createFileRoute } from '@tanstack/react-router';

import { InvitationPage } from 'src/pages/account/invitation.page';

export const Route = createFileRoute('/_main/account/organization_invitations/$invitationId')({
  component: InvitationPage,
});
