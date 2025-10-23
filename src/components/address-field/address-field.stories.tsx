import { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { Address } from 'src/model';

import { AddressField } from './address-field';

type Args = {
  error: boolean;
};

export default {
  title: 'Components/AddressField',
  args: {
    error: false,
  },
} satisfies Meta<Args>;

export const addressField: StoryFn<Args> = ({ error }) => {
  const [address, setAddress] = useState<Address>({
    line1: '',
    city: '',
    postalCode: '',
    country: '',
  });

  return (
    <AddressField
      value={address}
      onChange={setAddress}
      errors={error ? { line1: { message: 'Error message' } } : undefined}
      label="Address"
      placeholder="Search for an address"
    />
  );
};
