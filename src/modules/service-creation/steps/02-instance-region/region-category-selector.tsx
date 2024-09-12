import { SelectBox } from '@koyeb/design-system';
import { RegionCategory } from 'src/api/model';
import Logo from 'src/components/logo.svg?react';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import aws from 'src/icons/aws.png';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('serviceCreation.instanceRegions.regionCategorySelector');

type RegionCategorySelectorProps = {
  value: RegionCategory;
  onChange: (value: RegionCategory) => void;
};

export function RegionCategorySelector({ value, onChange }: RegionCategorySelectorProps) {
  if (!useFeatureFlag('aws-regions')) {
    return null;
  }

  return (
    <div className="col md:row gap-4">
      <SelectBox
        type="radio"
        icon={<Logo className="size-4" />}
        title={<T id="koyebLabel" />}
        description={<T id="koyebDescription" />}
        checked={value === 'koyeb'}
        onChange={() => onChange('koyeb')}
        className="max-w-md flex-1"
      />

      <SelectBox
        type="radio"
        icon={
          <div className="rounded p-0.5 dark:bg-white">
            <img src={aws} className="h-3" />
          </div>
        }
        title={<T id="awsLabel" />}
        description={<T id="awsDescription" />}
        checked={value === 'aws'}
        onChange={() => onChange('aws')}
        className="max-w-md flex-1"
      />
    </div>
  );
}
