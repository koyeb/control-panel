import { useState } from 'react';

import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { lowerCase } from 'src/utils/strings';

import { Combobox } from '../forms/combobox';
import { NoItems } from '../forms/helpers/no-items';

import countriesJson from './countries.json';

const T = createTranslate('components.addressAutocomplete');

type CountrySelectorProps = {
  ref?: React.Ref<HTMLInputElement>;
  countries?: string[];
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (country: string) => void;
};

export const CountrySelector = ({
  ref,
  countries = countriesJson,
  label,
  required,
  error,
  value,
  onChange,
}: CountrySelectorProps) => {
  const [filteredCountries, setFilteredCountries] = useState(countries);

  return (
    <Combobox
      ref={ref}
      label={label}
      required={required}
      invalid={Boolean(error)}
      helperText={error}
      items={filteredCountries}
      getKey={identity}
      itemToString={identity}
      renderItem={identity}
      renderNoItems={() => <NoItems message={<T id="noCountry" />} />}
      onInputValueChange={(inputValue, isSelected) => {
        if (!isSelected) {
          setFilteredCountries(countries.filter(getFilter(inputValue)));
        }
      }}
      onClosed={() => setFilteredCountries(countries)}
      value={value}
      onChange={(country) => country && onChange(country)}
    />
  );
};

function getFilter(inputValue: string) {
  const query = lowerCase(inputValue);

  return (country: string) => {
    if (query === '') {
      return true;
    }

    return lowerCase(country).includes(query);
  };
}
