import { useController } from 'react-hook-form';

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

  const instanceCtrl = useController<DatabaseServiceForm, 'instance'>({ name: 'instance' });
  const regionCtrl = useController<DatabaseServiceForm, 'region'>({ name: 'region' });

  const instance = databaseInstances.find(hasProperty('id', instanceCtrl.field.value));
  const region = regions.find(hasProperty('id', regionCtrl.field.value));
  const summary = useOrganizationSummary();

  const checkAvailability = (instance: CatalogInstance): InstanceAvailability => {
    if (instance.id === 'free' && summary.freeDatabaseUsed && !allowFreeInstanceIfAlreadyUsed) {
      return [false, 'freeAlreadyUsed'];
    }

    return [true];
  };

  const getBadges = (instance: CatalogInstance): InstanceSelectorBadge[] => {
    if (instance.plans && !inArray(organization.plan, instance.plans)) {
      return ['requiresHigherQuota'];
    }

    return [];
  };

  const selector = useInstanceSelector({
    instances: databaseInstances,
    regions,
    singleRegion: true,
    availabilities: toObject(databaseInstances, (instance) => instance.id, checkAvailability),
    selectedInstance: instance ?? null,
    setSelectedInstance: (instance) => instance && instanceCtrl.field.onChange(instance.id),
    selectedRegions: region ? [region] : [],
    setSelectedRegions: (region) => regionCtrl.field.onChange(region[0]?.id ?? null),
  });

  return (
    <div className="col max-h-96 scrollbar-thin gap-3 overflow-auto pe-2 scrollbar-green">
      <InstanceSelector {...selector} getBadges={getBadges} />
      <div />
    </div>
  );
}
