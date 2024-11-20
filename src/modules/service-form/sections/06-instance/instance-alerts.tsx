import { useFormState } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { useInstance, useRegion } from 'src/api/hooks/catalog';
import { useOrganization, useOrganizationSummary } from 'src/api/hooks/session';
import { CatalogInstance } from 'src/api/model';
import { DocumentationLink } from 'src/components/documentation-link';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.instance.alerts');

export function InstanceAlerts() {
  const { plan } = useOrganization();

  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const instance = useInstance(useWatchServiceForm('instance'));
  const previousInstance = useInstance(useWatchServiceForm('meta.previousInstance'));

  if (hasVolumes) {
    if (previousInstance) {
      const documentationLink = (children: React.ReactNode) => (
        <DocumentationLink path="/docs/reference/volumes" className="!text-default underline">
          {children}
        </DocumentationLink>
      );

      if (previousInstance.category === 'gpu') {
        return (
          <Alert
            variant={instance?.category === 'gpu' ? 'info' : 'error'}
            style="outline"
            title={<T id="gpuVolumesTitle" />}
            description={<T id="gpuVolumesDescription" values={{ documentationLink }} />}
          />
        );
      }

      if (!instance || instance?.category === 'gpu') {
        return (
          <Alert
            variant="error"
            style="outline"
            title={<T id="gpuToCpuWithVolumesTitle" />}
            description={<T id="gpuToCpuWithVolumesDescription" values={{ documentationLink }} />}
          />
        );
      }
    }

    if (instance?.category === 'eco') {
      return (
        <Alert
          variant="error"
          style="outline"
          title={<T id="ecoHasVolumesTitle" />}
          description={<T id="ecoHasVolumesDescription" />}
        />
      );
    }
  }

  if (plan === 'hobby') {
    return <HobbyPlanAlerts instance={instance} />;
  }

  return <PaidPlanAlerts instance={instance} />;
}

function HobbyPlanAlerts({ instance }: { instance?: CatalogInstance }) {
  const free = useInstance('free')?.displayName;

  const previousInstance = useInstance(useWatchServiceForm('meta.previousInstance'));
  const summary = useOrganizationSummary();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.instance?.message;

  const organization = useOrganization();
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

  if (summary?.freeInstanceUsed && previousInstance && previousInstance.identifier !== 'free') {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="freeInstanceAlreadyUsedTitle" values={{ instanceName: free }} />}
        description={<T id="freeInstanceAlreadyUsedDescription" />}
      />
    );
  }

  if (instance?.category === 'eco') {
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

function PaidPlanAlerts({ instance }: { instance?: CatalogInstance }) {
  const fra = useRegion('fra')?.displayName;
  const sin = useRegion('sin')?.displayName;
  const was = useRegion('was')?.displayName;

  const free = useInstance('free')?.displayName;

  const selectedRegions = useWatchServiceForm('regions');
  const onlyEcoRegionSelected = selectedRegions.every((region) => ['fra', 'sin', 'was'].includes(region));
  const standardInstanceRegionSelected = !onlyEcoRegionSelected;

  const sinSelected = selectedRegions.includes('sin');
  const summary = useOrganizationSummary();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.instance?.message;

  if (standardInstanceRegionSelected) {
    if (instance?.category === 'eco') {
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

  if (sinSelected && !summary?.freeInstanceUsed && instance?.category === 'eco') {
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
