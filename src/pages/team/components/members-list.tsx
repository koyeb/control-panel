import { Badge, Table, useBreakpoint } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import {
  apiMutation,
  apiQuery,
  mapOrganizationMember,
  useInvalidateApiQuery,
  useInvitationsQuery,
  useOrganization,
  useUser,
} from 'src/api';
import { notify } from 'src/application/notify';
import { openDialog } from 'src/components/dialog';
import { ActionsMenu, ButtonMenuItem } from 'src/components/dropdown-menu';
import { Select } from 'src/components/forms/select';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useSha256 } from 'src/hooks/hash';
import { useNavigate } from 'src/hooks/router';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { OrganizationInvitation, type OrganizationMember } from 'src/model';

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
                  value="owner"
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
  const t = T.useTranslate();

  const user = useUser();

  const resendInvitationMutation = useResendInvitation();
  const deleteInvitationMutation = useDeleteInvitation();
  const leaveOrganization = useLeaveOrganization();
  const removeOrganizationMember = useRemoveOrganizationMember();

  const onLeaveOrganization = (member: OrganizationMember) => {
    openDialog('Confirmation', {
      title: t('leaveOrganization.title'),
      description: t('leaveOrganization.description', { organizationName: member.organization.name }),
      confirmationText: member.organization.name,
      submitText: t('leaveOrganization.submitButton'),
      onConfirm: () => leaveOrganization.mutateAsync(member),
    });
  };

  const onRemoveMember = (member: OrganizationMember) => {
    openDialog('Confirmation', {
      title: t('removeMember.title'),
      description: t('removeMember.description', {
        name: member.user.name,
        organizationName: member.organization.name,
      }),
      confirmationText: member.organization.name,
      submitText: t('removeMember.submitButton'),
      onConfirm: () => removeOrganizationMember.mutateAsync(member),
    });
  };

  return (
    <ActionsMenu>
      {isInvitation(item) && (
        <ButtonMenuItem onClick={() => resendInvitationMutation.mutate(item)}>
          <T id="actions.resendInvitation" />
        </ButtonMenuItem>
      )}

      {isInvitation(item) && (
        <ButtonMenuItem onClick={() => deleteInvitationMutation.mutate(item)}>
          <T id="actions.deleteInvitation" />
        </ButtonMenuItem>
      )}

      {!isInvitation(item) && item.user.id === user?.id && (
        <ButtonMenuItem onClick={() => onLeaveOrganization(item)}>
          <T id="actions.leave" />
        </ButtonMenuItem>
      )}

      {!isInvitation(item) && item.user.id !== user?.id && (
        <ButtonMenuItem onClick={() => onRemoveMember(item)}>
          <T id="actions.removeMember" />
        </ButtonMenuItem>
      )}
    </ActionsMenu>
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
  const navigate = useNavigate();

  return useMutation({
    ...apiMutation('delete /v1/organization_members/{id}', (membership: OrganizationMember) => ({
      path: { id: membership.id },
    })),
    async onSuccess(_, membership) {
      await navigate({ to: '/', reloadDocument: true });
      notify.info(t('actions.leaveSuccessNotification', { organizationName: membership.organization.name }));
    },
  });
}
