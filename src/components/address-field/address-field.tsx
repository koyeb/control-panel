import {
  AutofillSuggestion,
  AutofillSuggestionResponse,
  MapboxAutofill,
  SearchSession,
} from '@mapbox/search-js-core';
import { useEffect, useMemo, useState } from 'react';
import { FieldError } from 'react-hook-form';

import { getConfig } from 'src/application/config';
import { createTranslate } from 'src/intl/translate';
import { Address } from 'src/model';

import { Combobox } from '../forms/combobox';
import { InputEndSpinner } from '../forms/helpers/input-end-spinner';
import { NoItems } from '../forms/helpers/no-items';

import { FallbackAddressFields } from './fallback-address-fields';

const T = createTranslate('components.addressAutocomplete');

type AddressFieldProps = {
  ref?: React.Ref<HTMLInputElement>;
  required?: boolean;
  size?: 1 | 2 | 3;
  label?: React.ReactNode;
  placeholder?: string;
  value: Address;
  onChange: (address: Address) => void;
  errors?: unknown;
};

export function AddressField({
  ref,
  required,
  size,
  label,
  placeholder,
  value,
  onChange,
  errors,
}: AddressFieldProps) {
  const [inputValue, setInputValue] = useState(formatAddress(value));
  const [pending, setPending] = useState(false);
  const [autofillDisabled, setAutofillDisabled] = useState(false);
  const [suggestions, setSuggestions] = useState<AutofillSuggestion[]>([]);

  const session = useMemo(() => {
    return new SearchSession(new MapboxAutofill({ accessToken: getConfig('mapboxToken') }), 500);
  }, []);

  useEffect(() => {
    const onSuggestions = (res: AutofillSuggestionResponse | null) => {
      setPending(false);
      setSuggestions(res?.suggestions ?? []);
    };

    session.addEventListener('suggest', onSuggestions);

    return () => {
      session.removeEventListener('suggest', onSuggestions);
    };
  }, [session]);

  useEffect(() => {
    if (Object.keys(errors ?? {}).length > 0) {
      setAutofillDisabled(true);
    }
  }, [errors]);

  if (autofillDisabled) {
    return <FallbackAddressFields value={value} onChange={onChange} errors={mapErrors(errors)} />;
  }

  const disableAutofillButton = (children: React.ReactNode) => (
    <button type="button" className="text-default underline" onClick={() => setAutofillDisabled(true)}>
      {children}
    </button>
  );

  return (
    <Combobox
      ref={ref}
      label={label}
      helperText={<T id="cantFindAddress" values={{ link: disableAutofillButton }} />}
      size={size}
      placeholder={placeholder}
      required={required}
      items={suggestions}
      getKey={(suggestion) => suggestion.full_address ?? ''}
      itemToString={(suggestion) => suggestion.full_address ?? ''}
      renderItem={(suggestion) => formatAddress(suggestionToAddress(suggestion))}
      renderNoItems={() => <NoItems message={<T id="searchAddress" />} />}
      inputValue={inputValue}
      onInputValueChange={(inputValue, isSelected) => {
        setInputValue(inputValue);

        if (!isSelected) {
          setPending(true);
          void session.suggest(inputValue);
        }
      }}
      end={<InputEndSpinner show={pending} />}
      onClosed={() => setSuggestions([])}
      onChange={(suggestion) => {
        if (suggestion) {
          onChange(suggestionToAddress(suggestion));
        }
      }}
    />
  );
}

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

function mapErrors(errors: unknown = {}) {
  const err = errors as Partial<Record<keyof Address, FieldError>>;

  return {
    line1: err?.line1?.message,
    line2: err?.line2?.message,
    city: err?.city?.message,
    postalCode: err?.postalCode?.message,
    state: err?.state?.message,
    country: err?.country?.message,
  };
}
