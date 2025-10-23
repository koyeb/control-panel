import { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { CountrySelector } from './country-selector';

export default {
  title: 'Components/CountrySelector',
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export const countrySelector: StoryFn = () => {
  const [country, setCountry] = useState('');

  return <CountrySelector value={country} onChange={setCountry} />;
};
