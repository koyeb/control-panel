import { Meta, StoryFn } from '@storybook/react';

import { controls } from 'src/storybook';

import { PlatformStatus } from './platform-status';

type Args = {
  status: string;
};

export default {
  title: 'Components/PlatformStatus',
  args: {
    status: 'UP',
  },
  argTypes: {
    status: controls.inlineRadio([
      'UP',
      'HASISSUES',
      'ALLUNDERMAINTENANCE',
      'ALLDEGRADEDPERFORMANCE',
      'ALLPARTIALOUTAGE',
      'ALLMINOROUTAGE',
      'ALLMAJOROUTAGE',
    ]),
  },
  decorators: [
    (Story) => (
      <div className="max-w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<Args>;

export const platformStatus: StoryFn<Args> = () => {
  return <PlatformStatus collapsed={false} />;
};

platformStatus.decorators = [
  (Story, { args }) => {
    window.fetch = () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ page: { status: args.status } }),
      } as Response);

    return <Story />;
  },
];
