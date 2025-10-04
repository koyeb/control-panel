import { Badge, ButtonMenuItem, Select, Table, useBreakpoint } from '@koyeb/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

import {
  apiMutation,
  apiQuery,
  getApi,
  mapOrganizationMember,
  useInvalidateApiQuery,
  useInvitationsQuery,
  useOrganization,
  useUser,
} from 'src/api';
import { notify } from 'src/application/notify';
import { setToken } from 'src/application/token';
import { ActionsMenu } from 'src/components/actions-menu';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { openDialog, useDialogContext } from 'src/components/dialog';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useSha256 } from 'src/hooks/hash';
import { useNavigate } from 'src/hooks/router';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { OrganizationInvitation, type OrganizationMember } from 'src/model';
import { identity } from 'src/utils/generic';

const T = createTranslate('pages.team.membersList');

export function MembersList() {
  const isMobile = !useBreakpoint('sm');

  const organization = useOrganization();
  const invitationsQuery = useInvitationsQuery({ status: 'PENDING' });

  const membersQuery = useQuery({
    ...apiQuery('get /v1/organization_members', { query: { organization_id: organization?.id } }),
    select: ({ members }) => members!.map(mapOrganizationMember),
  });

  if (invitationsQuery.isError) {
    return <QueryError error={invitationsQuery.error} />;
  }

  if (membersQuery.isError) {
    return <QueryError error={membersQuery.error} />;
  }

  return (
    <section className="col gap-6">
      <div className="col gap-1">
        <div className="font-medium">
          <T id="title" />
        </div>

        <p className="text-dim">
          <T id="description" values={{ organizationName: organization?.name }} />
        </p>
      </div>

      {(invitationsQuery.isPending || membersQuery.isPending) && <Loading className="min-h-16" />}

      {!invitationsQuery.isPending && !membersQuery.isPending && (
        <Table
          items={[...invitationsQuery.data, ...membersQuery.data]}
          columns={{
            member: {
              header: <T id="member" />,
              className: clsx('lg:w-72'),
              render: (item) =>
                isInvitation(item) ? (
                  <InvitationMember invitation={item} />
                ) : (
                  <OrganizationMember membership={item} />
                ),
            },
            role: {
              hidden: isMobile,
              header: <T id="role" />,
              render: () => (
                <Select
                  disabled
                  items={['owner']}
                  selectedItem="owner"
                  getKey={identity}
                  itemToString={identity}
                  renderItem={() => <T id="owner" />}
                  className="w-full max-w-64"
                />
              ),
            },
            joinDate: {
              header: <T id="joined" />,
              className: clsx('lg:w-48'),
              render: (item) =>
                isInvitation(item) ? (
                  <Translate id="common.noValue" />
                ) : (
                  <FormattedDistanceToNow value={item.joinedAt} />
                ),
            },
            actions: {
              className: clsx('w-12'),
              render: (item) => <Actions item={item} />,
            },
          }}
        />
      )}

      <ConfirmRemoveMemberDialog />
      <ConfirmLeaveOrganizationDialog />
    </section>
  );
}

function isInvitation(item: OrganizationInvitation | OrganizationMember): item is OrganizationInvitation {
  return 'email' in item;
}

function InvitationMember({ invitation }: { invitation: OrganizationInvitation }) {
  const emailHash = useSha256(invitation.email);

  return (
    <div className="row items-center gap-4">
      <img src={`https://gravatar.com/avatar/${emailHash ?? ''}`} className="size-8 rounded-full" />

      <div>
        <div className="font-medium">{invitation.email}</div>

        <Badge color="blue" size={1}>
          <T id="invited" />
        </Badge>
      </div>
    </div>
  );
}

function OrganizationMember({ membership }: { membership: OrganizationMember }) {
  return (
    <div className="row items-center gap-4">
      <img src={membership.user.avatarUrl} className="size-8 rounded-full" />

      <div>
        <div className="font-medium">{membership.user.name}</div>
        <div className="text-dim">{membership.user.email}</div>
      </div>
    </div>
  );
}

function Actions({ item }: { item: OrganizationInvitation | OrganizationMember }) {
  const user = useUser();

  const resendInvitationMutation = useResendInvitation();
  const deleteInvitationMutation = useDeleteInvitation();

  return (
    <ActionsMenu>
      {(withClose) => (
        <>
          {isInvitation(item) && (
            <>
              <ButtonMenuItem onClick={withClose(() => resendInvitationMutation.mutate(item))}>
                <T id="actions.resendInvitation" />
              </ButtonMenuItem>

              <ButtonMenuItem onClick={withClose(() => deleteInvitationMutation.mutate(item))}>
                <T id="actions.deleteInvitation" />
              </ButtonMenuItem>
            </>
          )}

          {!isInvitation(item) && (
            <>
              {item.user.id === user?.id && (
                <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmLeaveOrganization', item))}>
                  <T id="actions.leave" />
                </ButtonMenuItem>
              )}

              {item.user.id !== user?.id && (
                <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmRemoveMember', item))}>
                  <T id="actions.removeMember" />
                </ButtonMenuItem>
              )}
            </>
          )}
        </>
      )}
    </ActionsMenu>
  );
}

function ConfirmRemoveMemberDialog() {
  const organization = useOrganization();
  const organizationName = organization?.name ?? '';
  const member = useDialogContext<'ConfirmRemoveMember'>();

  const removeOrganizationMemberMutation = useRemoveOrganizationMember();

  return (
    <ConfirmationDialog
      id="ConfirmRemoveMember"
      title={<T id="removeMember.title" />}
      description={<T id="removeMember.description" values={{ name: member?.user.name, organizationName }} />}
      confirmationText={organizationName}
      submitText={<T id="removeMember.submitButton" />}
      onConfirm={() => removeOrganizationMemberMutation.mutateAsync(member!)}
    />
  );
}

function ConfirmLeaveOrganizationDialog() {
  const organization = useOrganization();
  const organizationName = organization?.name ?? '';
  const member = useDialogContext<'ConfirmLeaveOrganization'>();

  const leaveOrganizationMutation = useLeaveOrganization();

  return (
    <ConfirmationDialog
      id="ConfirmLeaveOrganization"
      title={<T id="leaveOrganization.title" />}
      description={<T id="leaveOrganization.description" values={{ organizationName }} />}
      confirmationText={organizationName}
      submitText={<T id="leaveOrganization.submitButton" />}
      onConfirm={() => leaveOrganizationMutation.mutateAsync(member!)}
    />
  );
}

function useResendInvitation() {
  const t = T.useTranslate();

  return useMutation({
    ...apiMutation('post /v1/organization_invitations/{id}/resend', (invitation: OrganizationInvitation) => ({
      path: { id: invitation.id },
    })),
    onSuccess(_, { email }) {
      notify.success(t('actions.resendInvitationSuccessNotification', { email }));
    },
  });
}

function useDeleteInvitation() {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  return useMutation({
    ...apiMutation('delete /v1/organization_invitations/{id}', (invitation: OrganizationInvitation) => ({
      path: { id: invitation.id },
    })),
    async onSuccess(_, { email }) {
      await invalidate('get /v1/organization_invitations');
      notify.info(t('actions.deleteInvitationSuccessNotification', { email }));
    },
  });
}

function useRemoveOrganizationMember() {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  return useMutation({
    ...apiMutation('delete /v1/organization_members/{id}', (membership: OrganizationMember) => ({
      path: { id: membership.id },
    })),
    async onSuccess(_, { user, organization }) {
      await invalidate('get /v1/organization_members');

      notify.info(
        t('actions.removeMemberSuccessNotification', {
          memberName: user.name,
          organizationName: organization.name,
        }),
      );
    },
  });
}

function useLeaveOrganization() {
  const t = T.useTranslate();

  const user = useUser();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    async mutationFn(membership: OrganizationMember) {
      const api = getApi();

      const { members } = await api('get /v1/organization_members', {
        query: { user_id: user!.id },
      });

      const [otherOrganizationId] = members!
        .map((member) => member.organization_id!)
        .filter((organizationId) => organizationId !== membership.organization.id);

      let result: string | null = null;

      if (otherOrganizationId) {
        const { token: newToken } = await api('post /v1/organizations/{id}/switch', {
          path: { id: otherOrganizationId },
          header: {},
        });

        result = newToken!.id!;
      }

      await api('delete /v1/organization_members/{id}', {
        path: { id: membership.id },
      });

      return result;
    },
    async onSuccess(token, { organization }) {
      await setToken(token, { queryClient });
      await navigate({ to: '/' });
      notify.info(t('actions.leaveSuccessNotification', { organizationName: organization.name }));
    },
  });
}
