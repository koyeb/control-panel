import { Autocomplete } from '@koyeb/design-system';
import { useEffect, useState } from 'react';

import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { lowerCase } from 'src/utils/strings';

import countriesJson from './countries.json';

const T = createTranslate('components.addressAutocomplete');

type CountrySelectorProps = {
  countries?: string[];
  name?: string;
  value?: string;
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  onChange?: (country: string) => void;
};

export const CountrySelector = ({
  countries = countriesJson,
  value,
  label,
  required,
  error,
  onChange,
}: CountrySelectorProps) => {
  const [inputValue, setInputValue] = useState(value ?? '');
  const [filteredCountries, setFilteredCountries] = useState(countries);

  const onSearch = (query: string) => {
    setInputValue(query);

    if (query === '' || query === value) {
      setFilteredCountries(countries);
    } else {
      setFilteredCountries(countries.filter((country) => lowerCase(country).includes(lowerCase(query))));
    }
  };

  useEffect(() => {
    setFilteredCountries(countries);
  }, [countries, value]);

  return (
    <Autocomplete
      required={required}
      label={label}
      error={error}
      items={filteredCountries}
      getKey={identity}
      itemToString={identity}
      renderItem={(country) => country}
      inputValue={inputValue}
      onInputValueChange={onSearch}
      onSelectedItemChange={onChange}
      renderNoItems={() => <T id="noCountry" />}
    />
  );
};
