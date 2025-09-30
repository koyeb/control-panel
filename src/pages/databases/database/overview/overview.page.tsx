import { isDatabaseDeployment, useDeployment, useService } from 'src/api';
import { LinkButton } from 'src/components/link';
import { NoResource } from 'src/components/no-resource';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

import { ConnectionDetails } from './connection-details';
import { DatabaseInfo } from './database-info';

const T = createTranslate('pages.database.overview');

export function OverviewPage() {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const service = useService(databaseServiceId);
  const deployment = useDeployment(service?.latestDeploymentId);

  if (!service || !deployment) {
    return null;
  }

  assert(isDatabaseDeployment(deployment));

  if (deployment.databases?.length === 0) {
    return (
      <NoResource
        title={<T id="noDatabase.title" />}
        description={<T id="noDatabase.description" />}
        cta={
          <LinkButton
            to="/database-services/$databaseServiceId/databases"
            params={{ databaseServiceId }}
            state={{ create: true }}
          >
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
