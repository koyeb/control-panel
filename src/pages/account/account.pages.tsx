import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { useEffect } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { useSetToken } from 'src/application/authentication';
import { LogoLoading } from 'src/components/logo-loading';
import { useNavigate } from 'src/hooks/router';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { ChangePasswordPage } from './change-password';
import { GithubOauthCallbackPage } from './github-oauth-callback';
import { InvitationPage } from './invitation.page';
import { ValidateAccountPage } from './validate-account.page';

export function AccountPages() {
  return (
    <Switch>
      <Route path="/account/oauth/github/callback" component={GithubOauthCallbackPage} />
      <Route path="/account/workos/callback" component={WorkOsCallbackPage} />
      <Route path="/account/reset-password/:token" component={ChangePasswordPage} />
      <Route>
        <SecondaryLayout>
          <Switch>
            <Route path="/account/validate/:token" component={ValidateAccountPage} />
            <Route path="/account/organization_invitations/:invitationId" component={InvitationPage} />
          </Switch>
        </SecondaryLayout>
      </Route>
    </Switch>
  );
}

function WorkOsCallbackPage() {
  const { getAccessToken } = useAuth();
  const setToken = useSetToken();
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: () => getAccessToken(),
    onSuccess: (token) => setToken(token),
    onSettled: () => navigate({ to: '/' }),
  });

  useEffect(() => {
    setTimeout(() => mutate(), 1000);
  }, [mutate]);

  return <LogoLoading />;
}
