import { useController, useFormContext } from 'react-hook-form';

import { useOrganization, useOrganizationSummary, useRegionsCatalog } from 'src/api';
import { InstanceAvailability } from 'src/application/instance-region-availability';
import { CatalogInstance } from 'src/model';
import { InstanceSelector, InstanceSelectorBadge } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { inArray } from 'src/utils/arrays';
import { hasProperty, toObject } from 'src/utils/object';

import { databaseInstances } from '../database-instance-types';
import { DatabaseServiceForm } from '../database-service-form.types';

const neonRegions = ['fra', 'was', 'sin'];

type DatabaseInstanceSelectorProps = {
  allowFreeInstanceIfAlreadyUsed?: boolean;
};

export function DatabaseInstanceSelector({ allowFreeInstanceIfAlreadyUsed }: DatabaseInstanceSelectorProps) {
  const organization = useOrganization();
  const regions = useRegionsCatalog(neonRegions);

  const { watch } = useFormContext<DatabaseServiceForm>();
  const isCreation = watch('meta.databaseServiceId') === null;

  const instanceCtrl = useController<DatabaseServiceForm, 'instance'>({ name: 'instance' });
  const regionCtrl = useController<DatabaseServiceForm, 'region'>({ name: 'region' });

  const selectedInstance = databaseInstances.find(hasProperty('id', instanceCtrl.field.value));
  const selectedRegion = regions.find(hasProperty('id', regionCtrl.field.value));
  const summary = useOrganizationSummary();

  const checkAvailability = (instance: CatalogInstance): InstanceAvailability => {
    if (instance.id === 'free' && summary.freeDatabaseUsed && !allowFreeInstanceIfAlreadyUsed) {
      return [false, 'freeAlreadyUsed'];
    }

    return [true];
  };

  const getBadges = (instance: CatalogInstance): InstanceSelectorBadge[] => {
    if (instance.plans && !inArray(organization?.plan, instance.plans)) {
      return ['requiresHigherQuota'];
    }

    return [];
  };

  const selector = useInstanceSelector({
    instances: databaseInstances,
    regions,
    singleRegion: true,
    availabilities: toObject(databaseInstances, (instance) => instance.id, checkAvailability),
    selectedInstance: selectedInstance ?? null,
    setSelectedInstance: (instance) => instance && instanceCtrl.field.onChange(instance.id),
    selectedRegions: selectedRegion ? [selectedRegion] : [],
    setSelectedRegions: (region) => regionCtrl.field.onChange(region[0]?.id ?? null),
  });

  return (
    <div className="col max-h-96 scrollbar-thin gap-3 overflow-auto pe-2 scrollbar-green">
      <InstanceSelector
        {...selector}
        canSelectRegion={(region) => isCreation || region.id === selectedRegion?.id}
        getBadges={getBadges}
      />
      <div />
    </div>
  );
}
