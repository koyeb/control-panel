import { useQueryClient } from '@tanstack/react-query';
import { UsersManagement, WorkOsWidgets } from '@workos-inc/widgets';

import { useAuthkitToken } from 'src/application/token';
import { Title } from 'src/components/title';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

import { InviteMemberForm } from './components/invite-member-form';
import { MembersList } from './components/members-list';

const T = createTranslate('pages.team');

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
  const queryClient = useQueryClient();
  const theme = useThemeMode();

  if (!token) {
    return null;
  }

  return (
    <WorkOsWidgets
      queryClient={queryClient}
      theme={{
        appearance: theme === 'system' ? 'inherit' : theme,
        fontFamily: 'var(--font-sans)',
        accentColor: 'green',
        grayColor: 'slate',
      }}
    >
      <UsersManagement authToken={token} />
    </WorkOsWidgets>
  );
}
