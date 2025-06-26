import { Meta } from '@storybook/react-vite';
import { useState } from 'react';

import { mapCatalogInstance, mapCatalogRegion } from 'src/api/mappers/catalog';
import { catalogInstanceFixtures, catalogRegionFixtures } from 'src/api/mock/fixtures';
import { CatalogInstance } from 'src/api/model';
import { InstanceAvailability } from 'src/application/instance-region-availability';
import { toObject } from 'src/utils/object';

import { InstanceCategoryTabs } from './instance-category-tabs';
import { InstanceSelector, InstanceSelectorBadge } from './instance-selector';
import { useInstanceSelector } from './instance-selector-state';

export default {
  title: 'Components/InstanceSelector',
  parameters: { className: 'max-w-3xl' },
} satisfies Meta;

const instances = catalogInstanceFixtures.map(mapCatalogInstance);
const regions = catalogRegionFixtures.map(mapCatalogRegion);

export const instanceSelector = () => {
  const [selectedInstance, setSelectedInstance] = useState<CatalogInstance | null>(instances[1]!);
  const [selectedRegions, setSelectedRegions] = useState([regions[1]!]);

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance,
    setSelectedInstance,
    selectedRegions,
    setSelectedRegions,
  });

  return (
    <div className="col gap-4">
      <InstanceCategoryTabs
        category={selector.instanceCategory}
        setCategory={selector.onInstanceCategorySelected}
      />

      <InstanceSelector {...selector} getBadges={({ id }) => badges[id] ?? []} />
    </div>
  );
};

const availabilities = toObject(
  instances,
  (instance) => instance.id,
  (): InstanceAvailability => [true],
);

const badges: Record<string, InstanceSelectorBadge[]> = {
  '4xlarge': ['requiresHigherQuota'],
  '5xlarge': ['requiresHigherQuota'],
  'gpu-nvidia-rtx-4000-sff-ada': ['new', 'insufficientVRam'],
  'gpu-nvidia-l4': ['new', 'bestFit'],
  '2-gpu-nvidia-l4': ['new'],
};
