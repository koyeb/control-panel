// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { DatabaseLayout } from './database.layout';
import { LogicalDatabasesPage } from './logical-databases/logical-databases.page';
import { OverviewPage } from './overview/overview.page';
import { DatabaseRolesPage } from './roles/database-roles.page';
import { DatabaseSettingsPage } from './settings/database-settings.page';

export function DatabaseServicePages() {
  return (
    <DatabaseLayout>
      <Switch>
        <Route path="/database-services/:databaseServiceId" component={OverviewPage} />
        <Route path="/database-services/:databaseServiceId/databases" component={LogicalDatabasesPage} />
        <Route path="/database-services/:databaseServiceId/roles" component={DatabaseRolesPage} />
        <Route path="/database-services/:databaseServiceId/settings" component={DatabaseSettingsPage} />
      </Switch>
    </DatabaseLayout>
  );
}
