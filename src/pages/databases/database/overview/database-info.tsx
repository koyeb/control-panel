import { isBefore } from 'date-fns';

import { useRegion } from 'src/api/hooks/catalog';
import { DatabaseDeployment, Service } from 'src/api/model';
import { formatBytes } from 'src/application/memory';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { ServiceStatusBadge } from 'src/components/status-badges';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { databaseInstances } from 'src/modules/database-form/database-instance-types';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.database.overview.info');

export function DatabaseInfo({ service, deployment }: { service: Service; deployment: DatabaseDeployment }) {
  const region = useRegion(deployment.region);
  const instance = databaseInstances.find(hasProperty('id', deployment.instance));
  const hasDatabaseActiveTime = useFeatureFlag('database-active-time');

  return (
    <section className="col gap-2">
      <header className="font-medium">
        <T id="title" />
      </header>

      <div className="row flex-wrap gap-x-8 gap-y-4 self-start rounded-md border px-3 py-2">
        <Metadata label={<T id="status" />} value={<ServiceStatusBadge status={service.status} />} />

        {isBefore(service.createdAt, '2025-05-09T16:00:00Z') && hasDatabaseActiveTime ? (
          <Metadata
            label={<T id="activeTime" />}
            value={
              <T
                id="activeTimeValue"
                values={{
                  used: deployment.activeTime.used,
                  max: secondsToHours(deployment.activeTime.max ?? null),
                }}
              />
            }
          />
        ) : (
          <Metadata
            label={<T id="computeTime" />}
            value={
              <T
                id="computeTimeValue"
                values={{
                  used: deployment.computeTime.used,
                  max: secondsToHours(deployment.computeTime.max ?? null),
                }}
              />
            }
          />
        )}

        <Metadata label={<T id="instance" />} value={instance?.displayName} />

        <Metadata label={<T id="disk" />} value={formatBytes(deployment.disk.used ?? 0, { round: true })} />

        <Metadata
          label={<T id="region" />}
          value={
            <div className="row items-center gap-2">
              <RegionFlag regionId={deployment.region} className="size-em" />
              {region?.name}
            </div>
          }
        />

        <Metadata
          label={<T id="engine" />}
          value={<T id="engineValue" values={{ version: deployment.postgresVersion }} />}
        />

        <Metadata label={<T id="created" />} value={<FormattedDistanceToNow value={service.createdAt} />} />
      </div>
    </section>
  );
}

function secondsToHours(value: number | null) {
  if (value === null) {
    return null;
  }

  return value / (60 * 60);
}
