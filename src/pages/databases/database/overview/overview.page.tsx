import { useDeployment, useService } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { NoResource } from 'src/components/no-resource';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

import { ConnectionDetails } from './connection-details';
import { DatabaseInfo } from './database-info';

const T = createTranslate('pages.database.overview');

export function OverviewPage() {
  const service = useService(useRouteParam('databaseServiceId'));
  const deployment = useDeployment(service?.activeDeploymentId);

  assert(service !== undefined);
  assert(isDatabaseDeployment(deployment));

  if (deployment.databases?.length === 0) {
    return (
      <NoResource
        title={<T id="noDatabase.title" />}
        description={<T id="noDatabase.description" />}
        cta={
          <LinkButton href={routes.database.logicalDatabases(service.id)} state={{ create: true }}>
            <T id="noDatabase.cta" />
          </LinkButton>
        }
      />
    );
  }

  return (
    <>
      <DatabaseInfo service={service} deployment={deployment} />
      <ConnectionDetails deployment={deployment} />
    </>
  );
}
