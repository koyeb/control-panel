import type { Meta, StoryFn } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';

import { defaultServiceForm } from '../helpers/initialize-service-form';

import { SubmitButton } from './submit-button';

const client = new QueryClient();

export default {
  title: 'Components/SubmitServiceFormButton',
  decorators: [
    (Story) => (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    ),
    (Story) => {
      const defaultValues = defaultServiceForm();

      defaultValues.meta.serviceId = 'serviceId';
      defaultValues.meta.hasPreviousBuild = true;

      const form = useForm({ defaultValues });

      return (
        <FormProvider {...form}>
          <Story />
        </FormProvider>
      );
    },
  ],
} satisfies Meta;

export const submitServiceFormButton: StoryFn = () => <SubmitButton loading={false} />;
