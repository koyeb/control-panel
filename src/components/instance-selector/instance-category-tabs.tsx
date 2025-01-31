import { TabButtons, TabButton } from '@koyeb/design-system';
import { CatalogInstance, InstanceCategory } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.instanceSelector.new');

const tabs: InstanceCategory[] = ['eco', 'standard', 'gpu'];

type InstanceCategoryTabsProps = {
  category: InstanceCategory;
  setCategory: (category: InstanceCategory) => void;
  instances: CatalogInstance[];
  setInstance: (instance: CatalogInstance | null) => void;
};

export function InstanceCategoryTabs({
  category,
  setCategory,
  instances,
  setInstance,
}: InstanceCategoryTabsProps) {
  const handleClick = (category: InstanceCategory) => {
    const instance = instances.find((instance) => instance.category === category);

    setCategory(category);
    setInstance(instance ?? null);
  };

  return (
    <TabButtons className="w-full">
      {tabs.map((value) => (
        <TabButton key={value} selected={value === category} onClick={() => handleClick(value)}>
          <T id={`instanceType.${value}`} />
        </TabButton>
      ))}
    </TabButtons>
  );
}
