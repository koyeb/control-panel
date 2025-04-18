import { useRegion } from 'src/api/hooks/catalog';
import { DatabaseDeployment, Service } from 'src/api/model';
import { formatBytes } from 'src/application/memory';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { ServiceStatusBadge } from 'src/components/status-badges';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.database.overview.info');

export function DatabaseInfo({ service, deployment }: { service: Service; deployment: DatabaseDeployment }) {
  const region = useRegion(deployment.region);

  return (
    <section className="col gap-2">
      <header className="font-medium">
        <T id="title" />
      </header>

      <div className="row flex-wrap gap-x-8 gap-y-4 self-start rounded-md border px-3 py-2">
        <Metadata label={<T id="status" />} value={<ServiceStatusBadge status={service.status} />} />

        <Metadata
          label={<T id="activeTime" />}
          value={
            <T
              id="activeTimeValue"
              values={{ used: deployment.activeTime.used, max: deployment.activeTime.max ?? null }}
            />
          }
        />

        <Metadata
          label={<T id="instance" />}
          value={<span className="capitalize">{deployment.instance}</span>}
        />

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
