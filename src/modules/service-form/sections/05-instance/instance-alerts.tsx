import { Alert } from '@koyeb/design-system';
import { useFormState } from 'react-hook-form';

import { useCatalogInstance, useCatalogRegion, useOrganization, useOrganizationSummary } from 'src/api';
import { DocumentationLink } from 'src/components/documentation-link';
import { createTranslate } from 'src/intl/translate';
import { CatalogInstance, InstanceCategory } from 'src/model';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.instance.alerts');

export function InstanceAlerts({ selectedCategory }: { selectedCategory: InstanceCategory }) {
  const organization = useOrganization();

  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const instance = useCatalogInstance(useWatchServiceForm('instance'));
  const previousInstance = useCatalogInstance(useWatchServiceForm('meta.previousInstance'));

  if (hasVolumes && selectedCategory === 'eco') {
    return (
      <Alert
        variant="error"
        style="outline"
        title={<T id="ecoHasVolumesTitle" />}
        description={<T id="ecoHasVolumesDescription" />}
      />
    );
  }

  if (hasVolumes && previousInstance) {
    const documentationLink = (children: React.ReactNode) => (
      <DocumentationLink path="/docs/reference/volumes" className="text-default! underline">
        {children}
      </DocumentationLink>
    );

    if (previousInstance.category === 'gpu') {
      return (
        <Alert
          variant={selectedCategory === 'gpu' ? 'info' : 'error'}
          style="outline"
          title={<T id="gpuVolumesTitle" />}
          description={<T id="gpuVolumesDescription" values={{ documentationLink }} />}
        />
      );
    }

    if (selectedCategory === 'gpu') {
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

  if (organization?.plan === 'hobby') {
    return <HobbyPlanAlerts instance={instance} />;
  }

  return <PaidPlanAlerts instance={instance} />;
}

function HobbyPlanAlerts({ instance }: { instance?: CatalogInstance }) {
  const free = useCatalogInstance('free')?.displayName;

  const previousInstance = useCatalogInstance(useWatchServiceForm('meta.previousInstance'));
  const summary = useOrganizationSummary();

  const { errors } = useFormState<ServiceForm>();
  const error = errors.instance?.message;

  const organization = useOrganization();
  const requireUpgrade = instance?.plans !== undefined && !instance.plans.includes(organization?.plan ?? '');

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

  if (summary.freeInstanceUsed && previousInstance && previousInstance.id !== 'free') {
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
  const fra = useCatalogRegion('fra')?.name;
  const sin = useCatalogRegion('sin')?.name;
  const was = useCatalogRegion('was')?.name;

  const free = useCatalogInstance('free')?.displayName;

  const selectedRegions = useWatchServiceForm('regions');
  const onlyEcoRegionSelected = selectedRegions.every((region) =>
    ['fra', 'sin', 'was', 'eu'].includes(region),
  );
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

  if (sinSelected && !summary.freeInstanceUsed && instance?.category === 'eco') {
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
