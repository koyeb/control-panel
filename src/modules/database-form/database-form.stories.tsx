import { action } from '@storybook/addon-actions';
import { Meta } from '@storybook/react';

import { DatabaseForm } from './database-form';

export default {
  title: 'Modules/DatabaseForm',
  parameters: { className: 'max-w-main' },
} satisfies Meta;

export const databaseForm = () => <DatabaseForm onCostChanged={action('onCostChanged')} />;
