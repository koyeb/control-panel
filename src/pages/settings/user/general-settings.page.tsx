import { useAuthKit } from 'src/application/authkit';
import { DeleteAccount } from 'src/modules/account/delete-account';

import { AuthKitUserSettings } from './components/authkit-user-settings';
import { GithubAccount } from './components/github-account';
import { NotificationSettings } from './components/notification-settings';
import { UserEmailForm } from './components/user-email-form';
import { UserNameForm } from './components/user-name-form';
import { UserPasswordForm } from './components/user-password-form';

export function GeneralSettingsPage() {
  const authKit = useAuthKit();

  return (
    <>
      {authKit.user && <AuthKitUserSettings />}
      <UserNameForm />
      <NotificationSettings />
      <GithubAccount />
      <UserEmailForm />
      <UserPasswordForm />
      <DeleteAccount />
    </>
  );
}
