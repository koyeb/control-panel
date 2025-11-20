import { UserProfile, UserSecurity } from '@workos-inc/widgets';
import { lazy } from 'react';

import { useAuthKit } from 'src/application/authkit';
import { DeleteAccount } from 'src/modules/account/delete-account';

import { GithubAccount } from './components/github-account';
import { NotificationSettings } from './components/notification-settings';
import { UserEmailForm } from './components/user-email-form';
import { UserNameForm } from './components/user-name-form';
import { UserPasswordForm } from './components/user-password-form';

const WorkOSWidgetsProvider = lazy(() => import('src/components/workos-widgets-provider'));

export function GeneralSettingsPage() {
  const authKit = useAuthKit();

  return (
    <>
      {!authKit.user && (
        <>
          <UserNameForm />
          <GithubAccount />
          <UserEmailForm />
          <UserPasswordForm />
        </>
      )}

      {authKit.user && <AuthKitUserSettings />}

      <NotificationSettings />
      <DeleteAccount />
    </>
  );
}

export function AuthKitUserSettings() {
  return (
    <WorkOSWidgetsProvider>
      {(token) => (
        <div className="col gap-8">
          <UserProfile authToken={token} />
          <UserSecurity authToken={token} />
        </div>
      )}
    </WorkOSWidgetsProvider>
  );
}
