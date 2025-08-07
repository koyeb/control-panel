import { TabButtons } from '@koyeb/design-system';
import { useState } from 'react';

import { useDeploymentQuery, useServiceQuery } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { TabButtonLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useRouteParam } from 'src/hooks/router';
import { Translate, createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

import { DatabaseAlerts } from './database-alerts';
import { DatabaseNotHealth } from './database-not-healthy';
import { DatabaseStarting } from './database-starting';

const T = createTranslate('pages.database.layout');

export function DatabaseLayout({ children }: { children: React.ReactNode }) {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const serviceQuery = useServiceQuery(databaseServiceId);
  const deploymentQuery = useDeploymentQuery(serviceQuery.data?.latestDeploymentId);

  const isStarting = serviceQuery.data?.status === 'STARTING';
  const [starting, setStarting] = useState(isStarting);

  if (serviceQuery.isPending || deploymentQuery.isPending) {
    return <Loading />;
  }

  if (serviceQuery.isError) {
    return <QueryError error={serviceQuery.error} />;
  }

  if (deploymentQuery.isError) {
    return <QueryError error={deploymentQuery.error} />;
  }

  const service = serviceQuery.data;
  const deployment = deploymentQuery.data;

  assert(isDatabaseDeployment(deployment));

  return (
    <div className="col gap-6">
      <div className="row max-w-full min-w-0 items-center gap-2">
        <ServiceTypeIcon type="database" size="big" />

        <div className="col min-w-0 gap-1">
          <div className="typo-heading">{service.name}</div>
          <div className="whitespace-nowrap text-dim">
            <Translate id="common.serviceType.database" />
          </div>
        </div>
      </div>

      <DatabaseAlerts service={service} deployment={deployment} />

      {starting ? (
        <DatabaseStarting isStarting={isStarting} onCompleted={() => setStarting(false)} />
      ) : (
        <>
          {service.status === 'UNHEALTHY' && <DatabaseNotHealth service={service} />}

          {service.status === 'HEALTHY' && (
            <>
              <Navigation />
              {children}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Navigation() {
  const databaseServiceId = useRouteParam('databaseServiceId');

  return (
    <TabButtons className="self-start">
      <TabButtonLink to="/database-services/$databaseServiceId" params={{ databaseServiceId }}>
        <T id="navigation.overview" />
      </TabButtonLink>
      <TabButtonLink to="/database-services/$databaseServiceId/databases" params={{ databaseServiceId }}>
        <T id="navigation.logicalDatabases" />
      </TabButtonLink>
      <TabButtonLink to="/database-services/$databaseServiceId/roles" params={{ databaseServiceId }}>
        <T id="navigation.roles" />
      </TabButtonLink>
      <TabButtonLink to="/database-services/$databaseServiceId/settings" params={{ databaseServiceId }}>
        <T id="navigation.settings" />
      </TabButtonLink>
    </TabButtons>
  );
}
