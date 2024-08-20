// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { BaseApiCredentialsPage } from '../api-credentials.page';

import { GeneralSettingsPage } from './general-settings.page';
import { OrganizationsPage } from './organizations.page';
import { UserSettingsLayout } from './user-settings.layout';

export function UserSettingsPages() {
  return (
    <UserSettingsLayout>
      <Switch>
        <Route path="/user/settings" component={GeneralSettingsPage} />
        <Route path="/user/settings/organizations" component={OrganizationsPage} />
        <Route path="/user/settings/api">
          <BaseApiCredentialsPage type="user" />
        </Route>
      </Switch>
    </UserSettingsLayout>
  );
}
