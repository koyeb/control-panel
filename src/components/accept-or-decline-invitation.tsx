import { useMutation } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { OrganizationInvitation } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('invitation');

type AcceptOrDeclineInvitationProps = {
  invitation: OrganizationInvitation;
};

export function AcceptOrDeclineInvitation({ invitation }: AcceptOrDeclineInvitationProps) {
  const { token, setToken } = useAccessToken();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const invitationId = invitation.id;

  const acceptMutation = useMutation({
    async mutationFn() {
      await api.acceptInvitation({ token, path: { id: invitationId } });

      const { token: newToken } = await api.switchOrganization({
        token,
        path: { id: invitation.organization.id },
        header: {},
      });

      return newToken!.id!;
    },
    async onSuccess(token) {
      await invalidate('listInvitations');
      setToken(token);
      navigate(routes.home());
      notify.info(t('acceptSuccess'));
    },
  });

  const declineMutation = useMutation({
    ...useApiMutationFn('declineInvitation', {
      path: { id: invitationId },
    }),
    async onSuccess() {
      await invalidate('listInvitations');
      navigate(routes.home());
      notify.info(t('declineSuccess'));
    },
  });

  if (invitation.status !== 'pending') {
    return (
      <div className="col items-center gap-6 text-base">
        <InvalidInvitationStatus invitation={invitation} />
      </div>
    );
  }

  return (
    <div className="col items-center gap-6">
      <h1 className="typo-heading">
        <T id="title" values={{ organizationName: invitation.organization.name }} />
      </h1>

      <p className="text-dim">
        <T id="description" values={{ name: invitation.inviter.name, email: invitation.inviter.email }} />
      </p>

      <div className="row gap-4 ">
        <Button onClick={() => acceptMutation.mutate()} loading={acceptMutation.isPending}>
          <T id="accept" />
        </Button>

        <Button
          variant="outline"
          color="gray"
          onClick={() => declineMutation.mutate()}
          loading={declineMutation.isPending}
        >
          <T id="decline" />
        </Button>
      </div>
    </div>
  );
}

function InvalidInvitationStatus({ invitation }: { invitation: OrganizationInvitation }) {
  if (invitation.status === 'accepted') {
    return <T id="alreadyAccepted" />;
  }

  if (invitation.status === 'refused') {
    return <T id="alreadyDeclined" />;
  }

  if (invitation.status === 'expired') {
    return <T id="expired" />;
  }

  return null;
}
