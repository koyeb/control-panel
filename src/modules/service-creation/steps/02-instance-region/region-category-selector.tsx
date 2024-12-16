import { InfoTooltip, SelectBox } from '@koyeb/design-system';
import { RegionCategory } from 'src/api/model';
import Logo from 'src/components/logo.svg?react';
import aws from 'src/icons/aws.png';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('serviceCreation.instanceRegions.regionCategorySelector');

type RegionCategorySelectorProps = {
  value: RegionCategory;
  onChange: (value: RegionCategory) => void;
};

export function RegionCategorySelector({ value, onChange }: RegionCategorySelectorProps) {
  return (
    <div className="col gap-4">
      <div className="text-base font-medium">
        <T id="label" />
      </div>

      <div className="col md:row gap-4">
        <SelectBox
          type="radio"
          checked={value === 'koyeb'}
          onChange={() => onChange('koyeb')}
          className="max-w-72 flex-1"
        >
          <div className="col gap-2 px-3 py-2">
            <div className="row items-center gap-2 font-medium">
              <Logo className="size-4" />
              <T id="koyebLabel" />
              <InfoTooltip content={<T id="koyebTooltip" />} />
            </div>
          </div>
        </SelectBox>

        <SelectBox
          disabled
          type="radio"
          checked={value === 'aws'}
          onChange={() => onChange('aws')}
          className="max-w-72 flex-1"
        >
          <div className="col gap-2 px-3 py-2">
            <div className="row items-center gap-2 font-medium">
              <div className="rounded p-0.5 dark:bg-white">
                <img src={aws} className="h-3" />
              </div>
              <T id="awsLabel" />
              <InfoTooltip content={<T id="awsTooltip" />} />
            </div>
          </div>
        </SelectBox>
      </div>
    </div>
  );
}
