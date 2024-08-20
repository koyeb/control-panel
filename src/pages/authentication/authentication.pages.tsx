// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { SecondaryLayoutTwoTones } from 'src/layouts/secondary/secondary-layout-two-tones';

import { ResetPasswordPage } from './reset-password.page';
import { SignInPage } from './sign-in.page';
import { SignUpPage } from './sign-up.page';
import { CannySso as CannySsoPage, DiscourseSsoPage } from './sso.pages';

export function AuthenticationPages() {
  return (
    <Switch>
      <Route path="/auth/sso/canny" component={CannySsoPage} />
      <Route path="/auth/sso/discourse" component={DiscourseSsoPage} />

      <Route>
        <SecondaryLayoutTwoTones className="font-gilroy font-medium" contentClassName="!max-w-md">
          <Switch>
            <Route path="/auth/signin" component={SignInPage} />
            <Route path="/auth/signup" component={SignUpPage} />
            <Route path="/auth/reset-password" component={ResetPasswordPage} />
          </Switch>
        </SecondaryLayoutTwoTones>
      </Route>
    </Switch>
  );
}
