// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { ChangePasswordPage } from './change-password';
import { GithubOauthCallbackPage } from './github-oauth-callback';
import { InvitationPage } from './invitation.page';
import { ValidateAccountPage } from './validate-account.page';

export function AccountPages() {
  return (
    <SecondaryLayout>
      <Switch>
        <Route path="/account/validate/:token" component={ValidateAccountPage} />
        <Route path="/account/reset-password/:token" component={ChangePasswordPage} />
        <Route path="/account/organization_invitations/:invitationId" component={InvitationPage} />
        <Route path="/account/oauth/github/callback" component={GithubOauthCallbackPage} />
      </Switch>
    </SecondaryLayout>
  );
}
