import { useState } from 'react';

import { TabButtons } from '@koyeb/design-system';
import { DatabaseDeployment, Service } from 'src/api/model';
import { routes } from 'src/application/routes';
import { TabButtonLink } from 'src/components/link';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { usePathname, useRouteParam } from 'src/hooks/router';
import { createTranslate, Translate } from 'src/intl/translate';

import { DatabaseAlerts } from './database-alerts';
import { DatabaseNotHealth } from './database-not-healthy';
import { DatabaseStarting } from './database-starting';

const T = createTranslate('pages.database.layout');

type DatabaseLayoutProps = {
  service: Service;
  deployment: DatabaseDeployment;
  children: React.ReactNode;
};

export function DatabaseLayout({ service, deployment, children }: DatabaseLayoutProps) {
  const isStarting = service.status === 'starting';
  const [starting, setStarting] = useState(isStarting);

  return (
    <div className="col gap-6">
      <div className="row min-w-0 max-w-full items-center gap-2">
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
          {service.status === 'unhealthy' && <DatabaseNotHealth service={service} />}

          {service.status === 'healthy' && (
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
      <Tab href={routes.database.overview(databaseServiceId)}>
        <T id="navigation.overview" />
      </Tab>
      <Tab href={routes.database.logicalDatabases(databaseServiceId)}>
        <T id="navigation.logicalDatabases" />
      </Tab>
      <Tab href={routes.database.roles(databaseServiceId)}>
        <T id="navigation.roles" />
      </Tab>
      <Tab href={routes.database.settings(databaseServiceId)}>
        <T id="navigation.settings" />
      </Tab>
    </TabButtons>
  );
}

function Tab(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return <TabButtonLink selected={pathname === props.href} className="whitespace-nowrap" {...props} />;
}
