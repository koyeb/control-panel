import { useFormState } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { useInstance, useRegion } from 'src/api/hooks/catalog';
import { useOrganization, useOrganizationSummary } from 'src/api/hooks/session';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.instance.alerts');

export function InstanceAlerts() {
  const { plan } = useOrganization();

  const { category } = useWatchServiceForm('instance');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.volumeId !== '').length > 0;

  if (category === 'eco' && hasVolumes) {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="ecoHasVolumesTitle" />}
        description={<T id="ecoHasVolumesDescription" />}
      />
    );
  }

  if (plan === 'hobby') {
    return <HobbyPlanAlerts />;
  }

  return <PaidPlanAlerts />;
}

function HobbyPlanAlerts() {
  const { category, identifier } = useWatchServiceForm('instance');

  const free = useInstance('free')?.displayName;

  const allowFreeInstanceIfAlreadyUsed = useWatchServiceForm('meta.allowFreeInstanceIfAlreadyUsed');
  const summary = useOrganizationSummary();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.instance?.identifier?.message;

  const organization = useOrganization();
  const instance = useInstance(identifier);
  const requireUpgrade = instance?.plans !== undefined && !instance.plans.includes(organization.plan);

  if (requireUpgrade) {
    return (
      <Alert
        variant="info"
        style="outline"
        title={
          <T
            id="instanceRequiresUpgradeTitle"
            values={{ plan: <span className="capitalize">{instance.plans?.[0]}</span> }}
          />
        }
        description={<T id="instanceRequiresUpgradeDescription" />}
      />
    );
  }

  if (summary?.freeInstanceUsed && !allowFreeInstanceIfAlreadyUsed) {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="freeInstanceAlreadyUsedTitle" values={{ instanceName: free }} />}
        description={<T id="freeInstanceAlreadyUsedDescription" />}
      />
    );
  }

  if (category === 'eco') {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="hobbyPlanTitle" values={{ instanceName: free }} />}
        description={<T id="hobbyPlanDescription" />}
      />
    );
  }

  if (error === 'noInstanceSelected') {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="noInstanceSelectedTitle" />}
        description={<T id="noInstanceSelectedDescription" />}
      />
    );
  }
}

function PaidPlanAlerts() {
  const fra = useRegion('fra')?.displayName;
  const sin = useRegion('sin')?.displayName;
  const was = useRegion('was')?.displayName;

  const free = useInstance('free')?.displayName;

  const selectedRegions = useWatchServiceForm('regions');
  const onlyEcoRegionSelected = selectedRegions.every((region) => ['fra', 'sin', 'was'].includes(region));
  const standardInstanceRegionSelected = !onlyEcoRegionSelected;

  const sinSelected = selectedRegions.includes('sin');
  const category = useWatchServiceForm('instance.category');
  const summary = useOrganizationSummary();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.instance?.identifier?.message;

  if (standardInstanceRegionSelected) {
    if (category === 'eco') {
      return (
        <Alert
          variant="error"
          style="outline"
          title={<T id="ecoInstancesTitle" values={{ fra, sin, was }} />}
          description={<T id="ecoInstancesDescription" />}
        />
      );
    } else {
      return null;
    }
  }

  if (sinSelected && !summary?.freeInstanceUsed && category === 'eco') {
    return (
      <Alert
        variant="info"
        style="outline"
        title={<T id="freeInstanceTitle" values={{ instanceName: free, fra, was }} />}
        description={<T id="freeInstanceDescription" />}
      />
    );
  }

  if (error === 'noInstanceSelected') {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="noInstanceSelectedTitle" />}
        description={<T id="noInstanceSelectedDescription" />}
      />
    );
  }
}
