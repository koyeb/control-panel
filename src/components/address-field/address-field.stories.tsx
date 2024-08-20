import { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { Address } from 'src/api/model';

import { AddressField } from './address-field';

export default {
  title: 'Components/AddressField',
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export const addressField: StoryFn = () => {
  const [address, setAddress] = useState<Address>();

  return <AddressField value={address} onChange={setAddress} />;
};
