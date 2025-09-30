import { Alert } from '@koyeb/design-system';

import { useCatalogRegion, useOrganization } from 'src/api';
import { createTranslate } from 'src/intl/translate';
import { CatalogInstance, CatalogRegion } from 'src/model';
import { QuotaAlert } from 'src/modules/service-form/components/quota-alert';

const T = createTranslate('modules.serviceCreation.instanceRegions.alerts');

type InstanceRegionAlertsProps = {
  selectedInstance: CatalogInstance | null;
  selectedRegions: CatalogRegion[];
};

export function InstanceRegionAlerts({
  selectedInstance: instance,
  selectedRegions: regions,
}: InstanceRegionAlertsProps) {
  const fra = useCatalogRegion('fra')?.name;
  const was = useCatalogRegion('was')?.name;

  const organization = useOrganization();
  const requireUpgrade = instance?.plans !== undefined && !instance.plans.includes(organization.plan);

  if (requireUpgrade) {
    return (
      <Alert
        variant="info"
        description={
          <T
            id="requiresUpgrade"
            values={{ plan: <span className="capitalize">{instance.plans?.[0]}</span> }}
          />
        }
      />
    );
  }

  if (instance?.id === 'free') {
    return <Alert variant="info" description={<T id="freeMessage" values={{ fra, was }} />} />;
  }

  return <QuotaAlert instance={instance?.id} regions={regions.map((region) => region.id)} />;
}
