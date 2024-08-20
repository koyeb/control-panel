// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { BaseApiCredentialsPage } from '../api-credentials.page';

import { BillingPage } from './billing/billing.page';
import { GeneralSettingsPage } from './general/general-settings.page';
import { OrganizationSettingsLayout } from './organization-settings.layout';
import { PlansPage } from './plans/plans.page';
import { RegistrySecretsPage } from './registry-secrets/registry-secrets.page';

export function OrganizationSettingsPages() {
  return (
    <OrganizationSettingsLayout>
      <Switch>
        <Route path="/settings" component={GeneralSettingsPage} />
        <Route path="/settings/billing" component={BillingPage} />
        <Route path="/settings/plans" component={PlansPage} />
        <Route path="/settings/api">
          <BaseApiCredentialsPage type="organization" />
        </Route>
        <Route path="/settings/registry-configuration" component={RegistrySecretsPage} />
      </Switch>
    </OrganizationSettingsLayout>
  );
}
