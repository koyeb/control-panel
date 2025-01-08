import { Input } from '@koyeb/design-system';
import { Address } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';

import { CountrySelector } from './country-selector';

const T = createTranslate('components.addressAutocomplete');

type FallbackAddressFieldsProps = {
  value?: Address;
  onChange?: (address: Address) => void;
  errors?: Partial<Record<keyof Address, string>>;
};

export const FallbackAddressFields = ({ value, onChange, errors }: FallbackAddressFieldsProps) => {
  const handleChange = (key: keyof Address, fieldValue: string) => {
    if (value) {
      onChange?.({ ...value, [key]: fieldValue });
    }
  };

  return (
    <div className="col gap-4">
      <Input
        required
        label={<T id="line1" />}
        value={value?.line1 ?? ''}
        onChange={(event) => handleChange('line1', event.target.value)}
        error={errors?.line1}
      />

      <Input
        label={<T id="line2" />}
        value={value?.line2 ?? ''}
        onChange={(event) => handleChange('line2', event.target.value)}
        error={errors?.line2}
      />

      <Input
        required
        label={<T id="city" />}
        value={value?.city ?? ''}
        onChange={(event) => handleChange('city', event.target.value)}
        error={errors?.city}
      />

      <div className="col sm:row gap-4">
        <Input
          required
          label={<T id="postalCode" />}
          value={value?.postalCode ?? ''}
          onChange={(event) => handleChange('postalCode', event.target.value)}
          error={errors?.postalCode}
          className="flex-1"
        />

        <Input
          label={<T id="state" />}
          value={value?.state ?? ''}
          onChange={(event) => handleChange('state', event.target.value)}
          error={errors?.state}
          className="flex-1"
        />
      </div>

      <CountrySelector
        required
        label={<T id="country" />}
        value={value?.country ?? ''}
        error={errors?.country}
        onChange={(value) => handleChange('country', value)}
      />
    </div>
  );
};
