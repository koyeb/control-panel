import { TabButton, TabButtons } from '@koyeb/design-system';

import { InstanceCategory } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.instanceSelector');

const tabs: InstanceCategory[] = ['eco', 'standard', 'gpu'];

type InstanceCategoryTabsProps = {
  category: InstanceCategory;
  setCategory: (category: InstanceCategory) => void;
};

export function InstanceCategoryTabs({ category, setCategory }: InstanceCategoryTabsProps) {
  return (
    <TabButtons className="w-full">
      {tabs.map((value) => (
        <TabButton key={value} selected={value === category} onClick={() => setCategory(value)}>
          <T id={`instanceType.${value}`} />
        </TabButton>
      ))}
    </TabButtons>
  );
}
