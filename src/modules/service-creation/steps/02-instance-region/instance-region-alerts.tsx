import { Alert } from '@koyeb/design-system';
import { useInstance, useRegion } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { Translate } from 'src/intl/translate';
import { QuotaAlert } from 'src/modules/service-form/components/quota-alert';

const T = Translate.prefix('serviceCreation.instanceRegions.alerts');

type InstanceRegionAlertsProps = {
  selectedInstance: string;
  selectedRegions: string[];
};

export function InstanceRegionAlerts({ selectedInstance, selectedRegions }: InstanceRegionAlertsProps) {
  const fra = useRegion('fra')?.displayName;
  const was = useRegion('was')?.displayName;

  const organization = useOrganization();
  const instance = useInstance(selectedInstance);
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

  if (selectedInstance === 'free') {
    return <Alert variant="info" description={<T id="freeMessage" values={{ fra, was }} />} />;
  }

  return <QuotaAlert instance={selectedInstance} regions={selectedRegions} />;
}
