import {
  AutofillSuggestion,
  AutofillSuggestionResponse,
  MapboxAutofill,
  SearchSession,
} from '@mapbox/search-js-core';
import { useEffect, useMemo, useState } from 'react';

import { Autocomplete } from '@koyeb/design-system';
import { Address } from 'src/api/model';
import { getConfig } from 'src/application/config';
import { Translate } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';

import { FallbackAddressFields } from './fallback-address-fields';

const T = Translate.prefix('addressAutocomplete');

type AddressFieldOwnProps = {
  value?: Address;
  onChange?: (address: Address) => void;
  errors?: Partial<Record<keyof Address, string>>;
};

type AddressFieldProps = AddressFieldOwnProps &
  Pick<
    React.ComponentProps<typeof Autocomplete<AutofillSuggestion>>,
    'required' | 'size' | 'label' | 'placeholder' | 'className'
  >;

export const AddressField = ({ value, onChange, errors, ...props }: AddressFieldProps) => {
  const { mapboxToken: accessToken } = getConfig();

  const [inputValue, setInputValue] = useState('');
  const [autofillDisabled, setAutofillDisabled] = useState(false);
  const [suggestions, setSuggestions] = useState<AutofillSuggestion[]>([]);

  const session = useMemo(() => {
    return new SearchSession(new MapboxAutofill({ accessToken }), 500);
  }, [accessToken]);

  useEffect(() => {
    if (value) {
      setInputValue(formatAddress(value));
    }
  }, [value]);

  useEffect(() => {
    const onSuggestions = (res: AutofillSuggestionResponse | null) => {
      setSuggestions(res?.suggestions ?? []);
    };

    session.addEventListener('suggest', onSuggestions);

    return () => {
      session.removeEventListener('suggest', onSuggestions);
    };
  }, [session]);

  useEffect(() => {
    if (Object.values(errors ?? {}).filter(isDefined).length > 0) {
      setAutofillDisabled(true);
    }
  }, [errors]);

  if (autofillDisabled) {
    return <FallbackAddressFields value={value} onChange={onChange} errors={errors} />;
  }

  const onInputValueChange = (query: string) => {
    setInputValue(query);
    void session.suggest(query);
  };

  return (
    <Autocomplete
      {...props}
      resetOnBlur={false}
      items={suggestions}
      getKey={(suggestion) => suggestion.full_address ?? ''}
      itemToString={(suggestion) => suggestion.full_address ?? ''}
      renderItem={(suggestion) => formatAddress(suggestionToAddress(suggestion))}
      renderNoItems={() => <T id="searchAddress" />}
      inputValue={inputValue}
      onInputValueChange={onInputValueChange}
      onSelectedItemChange={(suggestion) => onChange?.(suggestionToAddress(suggestion))}
      helperText={
        <button type="button" className="text-link" onClick={() => setAutofillDisabled(true)}>
          <T id="cantFindAddress" />
        </button>
      }
    />
  );
};

// place and region exist but are not declared in mapbox types
function suggestionToAddress(suggestion: AutofillSuggestion & { place?: string; region?: string }): Address {
  return {
    line1: suggestion.address_line1 ?? '',
    line2: [suggestion.address_line2, suggestion.address_line3].filter(Boolean).join(', '),
    city: suggestion.place ?? '',
    postalCode: suggestion.postcode ?? '',
    state: suggestion.region ?? '',
    country: suggestion.country ?? '',
  };
}

const formatAddress = (address: Address): string => {
  return [
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
};
