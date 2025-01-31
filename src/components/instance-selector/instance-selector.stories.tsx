import { Meta } from '@storybook/react';
import { useState } from 'react';

import { mapCatalogInstance, mapCatalogRegion } from 'src/api/mappers/catalog';
import { catalogInstanceFixtures, catalogRegionFixtures } from 'src/api/mock/fixtures';
import { CatalogInstance, InstanceCategory } from 'src/api/model';
import { hasProperty } from 'src/utils/object';

import { InstanceCategoryTabs } from './instance-category-tabs';
import { InstanceSelector, InstanceSelectorBadge } from './instance-selector';

export default {
  title: 'Components/InstanceSelector',
  parameters: { className: 'max-w-3xl' },
} satisfies Meta;

const instances = catalogInstanceFixtures.map(mapCatalogInstance);
const regions = catalogRegionFixtures.map(mapCatalogRegion).filter((region) => region.status === 'available');

export const instanceSelector = () => {
  const [selectedCategory, setSelectedCategory] = useState<InstanceCategory>('eco');
  const [selectedInstance, setSelectedInstance] = useState<CatalogInstance | null>(instances[1]!);
  const [selectedRegions, setSelectedRegions] = useState([regions[1]!]);

  return (
    <div className="col gap-4">
      <InstanceCategoryTabs
        category={selectedCategory}
        setCategory={setSelectedCategory}
        instances={instances}
        setInstance={setSelectedInstance}
      />

      <InstanceSelector
        instances={instances.filter(hasProperty('category', selectedCategory))}
        regions={regions}
        selectedInstance={selectedInstance}
        onInstanceSelected={setSelectedInstance}
        selectedRegions={selectedRegions}
        onRegionsSelected={setSelectedRegions}
        getBadges={({ identifier }) => badges[identifier] ?? []}
      />
    </div>
  );
};

const badges: Record<string, InstanceSelectorBadge[]> = {
  '4xlarge': ['requiresHigherQuota'],
  '5xlarge': ['requiresHigherQuota'],
  'gpu-nvidia-rtx-4000-sff-ada': ['new', 'insufficientVRam'],
  'gpu-nvidia-l4': ['new', 'bestFit'],
  '2-gpu-nvidia-l4': ['new'],
};
