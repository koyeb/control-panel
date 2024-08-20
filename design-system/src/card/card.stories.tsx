import type { Meta, StoryFn } from '@storybook/react';

import { ComponentPlaceholder } from '../utils/storybook';

export default {
  title: 'DesignSystem/Card',
} satisfies Meta;

export const Default: StoryFn = () => (
  <div className="card max-w-sm p-4">
    <ComponentPlaceholder />
  </div>
);
