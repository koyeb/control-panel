import { DeleteAccount } from './components/delete-account';
import { GithubAccount } from './components/github-account';
import { UserEmailForm } from './components/user-email-form';
import { UserNameForm } from './components/user-name-form';
import { UserPasswordForm } from './components/user-password-form';

export function GeneralSettingsPage() {
  return (
    <>
      <UserNameForm />
      <GithubAccount />
      <UserEmailForm />
      <UserPasswordForm />
      <DeleteAccount />
    </>
  );
}
