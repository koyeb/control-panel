import { Meta, StoryObj } from '@storybook/react-vite';

import { create } from 'src/utils/factories';

import { ServiceEstimatedCost } from './service-estimated-cost';

export default {
  title: 'Components/ServiceEstimatedCost',
  parameters: { className: 'max-w-sm p-4 border rounded-md' },
  render: (args) => <ServiceEstimatedCost {...args} />,
} satisfies Meta<typeof ServiceEstimatedCost>;

export const freeInstance: StoryObj<typeof ServiceEstimatedCost> = {
  args: {
    cost: {
      instance: create.instance({ id: 'free', displayName: 'Free' }),
      instanceCount: 1,
      regionCount: 1,
      instancesPrice: { perHour: 0, perMonth: 0 },
      totalPrice: { perHour: 0, perMonth: 0 },
    },
  },
};

export const singleInstance: StoryObj<typeof ServiceEstimatedCost> = {
  args: {
    cost: {
      instance: create.instance({ displayName: 'Nano' }),
      instanceCount: 1,
      regionCount: 1,
      instancesPrice: { perHour: 0.12, perMonth: 2.68 },
      totalPrice: { perHour: 0.12, perMonth: 2.68 },
    },
  },
};

export const multipleRegions: StoryObj<typeof ServiceEstimatedCost> = {
  args: {
    cost: {
      instance: create.instance({ displayName: 'Nano' }),
      instanceCount: 1,
      regionCount: 3,
      instancesPrice: { perHour: 0.12, perMonth: 2.68 },
      totalPrice: { perHour: 0.36, perMonth: 8.04 },
    },
  },
};

export const autoscaling: StoryObj<typeof ServiceEstimatedCost> = {
  args: {
    cost: [
      {
        instance: create.instance({ displayName: 'Nano' }),
        instanceCount: 1,
        regionCount: 1,
        instancesPrice: { perHour: 0.12, perMonth: 2.68 },
        totalPrice: { perHour: 0.12, perMonth: 2.68 },
      },
      {
        instance: create.instance({ displayName: 'Nano' }),
        instanceCount: 3,
        regionCount: 1,
        instancesPrice: { perHour: 0.12, perMonth: 2.68 },
        totalPrice: { perHour: 0.36, perMonth: 8.04 },
      },
    ],
  },
};

export const autoscalingMultipleRegion: StoryObj<typeof ServiceEstimatedCost> = {
  args: {
    cost: [
      {
        instance: create.instance({ displayName: 'Nano' }),
        instanceCount: 1,
        regionCount: 3,
        instancesPrice: { perHour: 0.36, perMonth: 8.04 },
        totalPrice: { perHour: 0.36, perMonth: 8.04 },
      },
      {
        instance: create.instance({ displayName: 'Nano' }),
        instanceCount: 3,
        regionCount: 3,
        instancesPrice: { perHour: 0.36, perMonth: 8.04 },
        totalPrice: { perHour: 1.08, perMonth: 24.12 },
      },
    ],
  },
};
