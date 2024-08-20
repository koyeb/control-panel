// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { useDeploymentQuery, useServiceQuery } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import { assert } from 'src/utils/assert';

import { DatabaseLayout } from './database.layout';
import { LogicalDatabasesPage } from './logical-databases/logical-databases.page';
import { OverviewPage } from './overview/overview.page';
import { DatabaseRolesPage } from './roles/database-roles.page';
import { DatabaseSettingsPage } from './settings/database-settings.page';

export function DatabaseServicePages() {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const serviceQuery = useServiceQuery(databaseServiceId);
  const latestDeploymentQuery = useDeploymentQuery(serviceQuery.data?.latestDeploymentId);
  const activeDeploymentQuery = useDeploymentQuery(serviceQuery.data?.activeDeploymentId);

  if (serviceQuery.isPending || latestDeploymentQuery.isPending) {
    return <Loading />;
  }

  if (serviceQuery.isError) {
    return <QueryError error={serviceQuery.error} />;
  }

  if (latestDeploymentQuery.isError) {
    return <QueryError error={latestDeploymentQuery.error} />;
  }

  if (activeDeploymentQuery.isError) {
    return <QueryError error={activeDeploymentQuery.error} />;
  }

  const service = serviceQuery.data;
  const latestDeployment = latestDeploymentQuery.data;

  assert(isDatabaseDeployment(latestDeployment));

  return (
    <DatabaseLayout service={service} deployment={latestDeployment}>
      {latestDeployment && (
        <Switch>
          <Route path="/database-services/:databaseServiceId" component={OverviewPage} />
          <Route path="/database-services/:databaseServiceId/databases" component={LogicalDatabasesPage} />
          <Route path="/database-services/:databaseServiceId/roles" component={DatabaseRolesPage} />
          <Route path="/database-services/:databaseServiceId/settings" component={DatabaseSettingsPage} />
        </Switch>
      )}
    </DatabaseLayout>
  );
}
