import { UsersManagement } from '@workos-inc/widgets';
import { lazy } from 'react';

import { useAuthkitToken } from 'src/application/token';
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
        <AuthKitUsersManagement />
      </FeatureFlag>
    </div>
  );
}

export function AuthKitUsersManagement() {
  const token = useAuthkitToken();

  if (!token) {
    return null;
  }

  return (
    <div className="mt-4 col gap-4">
      <div className="font-medium">WorkOS</div>

      <WorkOSWidgetsProvider>{(token) => <UsersManagement authToken={token} />}</WorkOSWidgetsProvider>
    </div>
  );
}
