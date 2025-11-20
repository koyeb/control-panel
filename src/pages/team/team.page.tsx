import { useQuery } from '@tanstack/react-query';
import { UsersManagement } from '@workos-inc/widgets';
import { lazy } from 'react';

import { apiQuery, useOrganizationQuotas } from 'src/api';
import { Title } from 'src/components/title';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';

import { InviteMemberForm } from './components/invite-member-form';
import { MembersList } from './components/members-list';

const T = createTranslate('pages.team');

const WorkOSWidgetsProvider = lazy(() => import('src/components/workos-widgets-provider'));

export function TeamPage() {
  return (
    <div className="col gap-4">
      <Title title={<T id="title" />} />
      <MembersList />
      <InviteMemberForm />
      <FeatureFlag feature="workos-user-management">
        <WorkOSUsersManagement />
      </FeatureFlag>
    </div>
  );
}

export function WorkOSUsersManagement() {
  const { data: membersCount = 0 } = useQuery({
    ...apiQuery('get /v1/organization_members', {}),
    select: ({ count }) => count!,
  });

  const quotas = useOrganizationQuotas();
  const canAddMembers = membersCount < quotas.maxOrganizationMembers;

  return (
    <WorkOSWidgetsProvider>
      {(token) => (
        <div className="mt-4 col gap-4">
          <div className="font-medium">WorkOS</div>

          {!canAddMembers && <style>{hideInviteUserButton}</style>}

          <UsersManagement authToken={token} />
        </div>
      )}
    </WorkOSWidgetsProvider>
  );
}

// cspell:ignore woswidgets
const hideInviteUserButton = `
.woswidgets-button--primary {
  display: none;
}`.trim();
