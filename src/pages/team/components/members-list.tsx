import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { Badge, ButtonMenuItem, Select, Table, useBreakpoint } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useInvitationsQuery } from 'src/api/hooks/invitation';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { mapOrganizationMembers } from 'src/api/mappers/session';
import { OrganizationInvitation, type OrganizationMember } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { ActionsMenu } from 'src/components/actions-menu';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useSha256 } from 'src/hooks/hash';
import { useNavigate } from 'src/hooks/router';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate, Translate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

const T = createTranslate('pages.team.membersList');

export function MembersList() {
  const isMobile = !useBreakpoint('sm');

  const organization = useOrganization();
  const invitationsQuery = useInvitationsQuery({ status: 'pending' });

  const membersQuery = useQuery({
    ...useApiQueryFn('listOrganizationMembers', { query: { organization_id: organization.id } }),
    select: mapOrganizationMembers,
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
          <T id="description" values={{ organizationName: organization.name }} />
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
    </section>
  );
}

function isInvitation(item: OrganizationInvitation | OrganizationMember): item is OrganizationInvitation {
  return 'status' in item;
}

function InvitationMember({ invitation }: { invitation: OrganizationInvitation }) {
  const emailHash = useSha256(invitation.invitee.email);

  return (
    <div className="row items-center gap-4">
      <img src={`https://gravatar.com/avatar/${emailHash ?? ''}`} className="size-8 rounded-full" />

      <div>
        <div className="font-medium">{invitation.invitee.email}</div>

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
      <img src={membership.member.avatarUrl} className="size-8 rounded-full" />

      <div>
        <div className="font-medium">{membership.member.name}</div>
        <div className="text-dim">{membership.member.email}</div>
      </div>
    </div>
  );
}

function Actions({ item }: { item: OrganizationInvitation | OrganizationMember }) {
  const user = useUser();

  const organization = useOrganization();
  const organizationName = organization.name;

  const [openDialog, setOpenDialog] = useState<'removeMember' | 'leaveOrganization'>();

  const resendInvitationMutation = useResendInvitation();
  const deleteInvitationMutation = useDeleteInvitation();
  const removeOrganizationMemberMutation = useRemoveOrganizationMember();
  const leaveOrganizationMutation = useLeaveOrganization();

  return (
    <>
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
                {item.member.id === user.id && (
                  <ButtonMenuItem onClick={withClose(() => setOpenDialog('leaveOrganization'))}>
                    <T id="actions.leave" />
                  </ButtonMenuItem>
                )}

                {item.member.id !== user.id && (
                  <ButtonMenuItem onClick={withClose(() => setOpenDialog('removeMember'))}>
                    <T id="actions.removeMember" />
                  </ButtonMenuItem>
                )}
              </>
            )}
          </>
        )}
      </ActionsMenu>

      {!isInvitation(item) && (
        <>
          <ConfirmationDialog
            open={openDialog === 'removeMember'}
            onClose={() => setOpenDialog(undefined)}
            title={<T id="removeMember.title" />}
            description={
              <T id="removeMember.description" values={{ name: item.member.name, organizationName }} />
            }
            confirmationText={organizationName}
            submitText={<T id="removeMember.submitButton" />}
            onConfirm={() => removeOrganizationMemberMutation.mutateAsync(item)}
          />

          <ConfirmationDialog
            open={openDialog === 'leaveOrganization'}
            onClose={() => setOpenDialog(undefined)}
            title={<T id="leaveOrganization.title" />}
            description={<T id="leaveOrganization.description" values={{ organizationName }} />}
            confirmationText={organizationName}
            submitText={<T id="leaveOrganization.submitButton" />}
            onConfirm={() => leaveOrganizationMutation.mutateAsync(item)}
          />
        </>
      )}
    </>
  );
}

function useResendInvitation() {
  const t = T.useTranslate();

  return useMutation({
    ...useApiMutationFn('resendInvitation', (invitation: OrganizationInvitation) => ({
      path: { id: invitation.id },
    })),
    onSuccess(_, { invitee }) {
      notify.success(t('actions.resendInvitationSuccessNotification', { email: invitee.email }));
    },
  });
}

function useDeleteInvitation() {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  return useMutation({
    ...useApiMutationFn('deleteInvitation', (invitation: OrganizationInvitation) => ({
      path: { id: invitation.id },
    })),
    async onSuccess(_, { invitee }) {
      await invalidate('listInvitations');
      notify.info(t('actions.deleteInvitationSuccessNotification', { email: invitee.email }));
    },
  });
}

function useRemoveOrganizationMember() {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  return useMutation({
    ...useApiMutationFn('deleteOrganizationMember', (membership: OrganizationMember) => ({
      path: { id: membership.id },
    })),
    async onSuccess(_, { member, organization }) {
      await invalidate('listOrganizationMembers');

      notify.info(
        t('actions.removeMemberSuccessNotification', {
          memberName: member.name,
          organizationName: organization.name,
        }),
      );
    },
  });
}

function useLeaveOrganization() {
  const { token, setToken, clearToken } = useToken();
  const user = useUser();
  const navigate = useNavigate();
  const t = T.useTranslate();

  return useMutation({
    async mutationFn(membership: OrganizationMember) {
      const { members } = await api.listOrganizationMembers({
        token,
        query: { user_id: user.id },
      });

      const [otherOrganizationId] = members!
        .map((member) => member.organization_id!)
        .filter((organizationId) => organizationId !== membership.organization.id);

      let result: string | undefined = undefined;

      if (otherOrganizationId) {
        const { token: newToken } = await api.switchOrganization({
          token,
          path: { id: otherOrganizationId },
          header: {},
        });

        result = newToken!.id!;
      }

      await api.deleteOrganizationMember({
        token,
        path: { id: membership.id },
      });

      return result;
    },
    async onSuccess(token, { organization }) {
      if (token !== undefined) {
        setToken(token);
      } else {
        clearToken();
      }

      navigate(routes.home());
      notify.info(t('actions.leaveSuccessNotification', { organizationName: organization.name }));
    },
  });
}
