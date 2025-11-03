import { Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery, useSwitchOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { OrganizationInvitation } from 'src/model';
import { AuthButton } from 'src/pages/authentication/components/auth-button';

import { IconArrowRight } from '../icons';

const T = createTranslate('components.invitation');

type HandleInvitationsProps = {
  invitation: OrganizationInvitation;
};

export function HandleInvitation({ invitation }: HandleInvitationsProps) {
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const switchOrganization = useSwitchOrganization();

  const acceptMutation = useMutation({
    ...apiMutation('post /v1/account/organization_invitations/{id}/accept', {
      path: { id: invitation.id },
    }),
    async onSuccess() {
      await switchOrganization.mutateAsync(invitation.organization.id);
      await navigate({ to: '/', reloadDocument: true });
    },
  });

  const declineMutation = useMutation({
    ...apiMutation(
      'post /v1/account/organization_invitations/{id}/decline',
      (invitation: OrganizationInvitation) => ({
        path: { id: invitation.id },
      }),
    ),
    async onSuccess() {
      await invalidate('get /v1/organization_invitations');
      await navigate({ to: '/' });
      notify.info(t('declineSuccess'));
    },
  });

  if (invitation.status !== 'PENDING') {
    return <InvalidInvitationStatus invitation={invitation} />;
  }

  return (
    <div className="col w-full max-w-md items-center gap-12 text-center">
      <div className="col gap-2">
        <h1 className="text-4xl font-semibold text-dim">
          <T id="title" values={{ hasInviter: invitation.inviter !== null }} />
        </h1>

        <div className="text-xl font-semibold">
          <T id="description" values={{ email: invitation.inviter?.email }} />
        </div>
      </div>

      <div className="row w-full items-center justify-between rounded-lg border p-4">
        <div className="text-xl font-semibold">{invitation.organization.name}</div>

        <AuthButton onClick={() => acceptMutation.mutate()}>
          <T id="accept" />
          {acceptMutation.isPending ? <Spinner className="size-4" /> : <IconArrowRight className="size-4" />}
        </AuthButton>
      </div>

      <div className="text-xs">
        <T
          id="decline"
          values={{
            link: (children) => (
              <button type="button" onClick={() => declineMutation.mutate(invitation)} className="underline">
                {children}
              </button>
            ),
          }}
        />
      </div>
    </div>
  );
}

function InvalidInvitationStatus({ invitation }: { invitation: OrganizationInvitation }) {
  if (invitation.status === 'ACCEPTED') {
    return <T id="alreadyAccepted" />;
  }

  if (invitation.status === 'REFUSED') {
    return <T id="alreadyDeclined" />;
  }

  if (invitation.status === 'EXPIRED') {
    return <T id="expired" />;
  }

  return null;
}
