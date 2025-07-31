import { DeleteAccount } from 'src/modules/account/delete-account';

import { GithubAccount } from './components/github-account';
import { NotificationSettings } from './components/notification-settings';
import { UserEmailForm } from './components/user-email-form';
import { UserNameForm } from './components/user-name-form';
import { UserPasswordForm } from './components/user-password-form';

export function GeneralSettingsPage() {
  return (
    <>
      <UserNameForm />
      <NotificationSettings />
      <GithubAccount />
      <UserEmailForm />
      <UserPasswordForm />
      <DeleteAccount />
    </>
  );
}
