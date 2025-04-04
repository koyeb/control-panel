import { Alert } from '@koyeb/design-system';
import { useRegion } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { CatalogInstance, CatalogRegion } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';
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
  const fra = useRegion('fra')?.name;
  const was = useRegion('was')?.name;

  const organization = useOrganization();
  const requireUpgrade = instance?.plans !== undefined && !instance.plans.includes(organization.plan);

  if (requireUpgrade) {
    return (
      <Alert
        variant="info"
        description={
          <T
            id="requiresUpgrade"
            values={{ plan: <span className="capitalize">{instance?.plans?.[0]}</span> }}
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
