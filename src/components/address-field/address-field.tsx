import { Autocomplete } from '@koyeb/design-system';
import {
  AutofillSuggestion,
  AutofillSuggestionResponse,
  MapboxAutofill,
  SearchSession,
} from '@mapbox/search-js-core';
import { useEffect, useMemo, useState } from 'react';
import { Control, useController } from 'react-hook-form';

import { Address } from 'src/api/model';
import { getConfig } from 'src/application/config';
import { createTranslate } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';
import { Extend } from 'src/utils/types';

import { FallbackAddressFields } from './fallback-address-fields';

const T = createTranslate('components.addressAutocomplete');

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
  const accessToken = getConfig('mapboxToken');

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

  const disableAutofillButton = (children: React.ReactNode) => (
    <button type="button" className="text-default underline" onClick={() => setAutofillDisabled(true)}>
      {children}
    </button>
  );

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
      helperText={<T id="cantFindAddress" values={{ link: disableAutofillButton }} />}
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

type ControlledAddressFieldProps = Extend<
  React.ComponentProps<typeof AddressField>,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control?: Control<any>;
    name: string;
  }
>;

export function ControlledAddressField({ control, name, ...props }: ControlledAddressFieldProps) {
  const { field, fieldState } = useController({ control, name });
  const error = fieldState.error as Record<string, { message: string }> | undefined;

  return (
    <AddressField
      {...props}
      value={field.value as Address | undefined}
      onChange={field.onChange}
      errors={{
        line1: error?.line1?.message,
        line2: error?.line2?.message,
        city: error?.city?.message,
        postalCode: error?.postalCode?.message,
        state: error?.state?.message,
        country: error?.country?.message,
      }}
    />
  );
}
