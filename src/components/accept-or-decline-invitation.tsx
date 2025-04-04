import { useMutation } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { OrganizationInvitation } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.invitation');

type AcceptOrDeclineInvitationProps = {
  invitation: OrganizationInvitation;
};

export function AcceptOrDeclineInvitation({ invitation }: AcceptOrDeclineInvitationProps) {
  const { token, setToken } = useToken();
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

  if (invitation.status !== 'PENDING') {
    return (
      <div className="col items-center gap-6 text-base">
        <InvalidInvitationStatus invitation={invitation} />
      </div>
    );
  }

  return (
    <div className="col w-full max-w-xl items-center gap-6 text-center">
      <h1 className="typo-heading">
        <T
          id="title"
          values={{
            organization: (children) => <div className="mt-1 text-4xl">{children}</div>,
            organizationName: invitation.organization.name,
          }}
        />
      </h1>

      <div className="col gap-4">
        <div className="font-medium text-dim">
          <T
            id="description"
            values={{
              name: invitation.inviter.name,
              email: <span className="text-green">{invitation.inviter.email}</span>,
            }}
          />
        </div>

        <div className="row justify-center gap-4">
          <Button
            size={3}
            color="gray"
            onClick={() => declineMutation.mutate()}
            loading={declineMutation.isPending}
          >
            <T id="decline" />
          </Button>

          <Button size={3} onClick={() => acceptMutation.mutate()} loading={acceptMutation.isPending}>
            <T id="accept" />
          </Button>
        </div>
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
