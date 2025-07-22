import { Meta, StoryFn } from '@storybook/react-vite';

import { controls } from 'src/storybook';

import { PlatformStatus } from './platform-status';

// cSpell:ignore hasissues undermaintenance degradedperformance partialoutage majoroutage

type Args = {
  name: string;
  status: string;
  impact: string;
};

export default {
  title: 'Components/PlatformStatus',
  args: {
    name: '',
    status: 'UP',
    impact: 'OPERATIONAL',
  },
  argTypes: {
    name: controls.string(),
    status: controls.inlineRadio(['UP', 'HASISSUES', 'UNDERMAINTENANCE']),
    impact: controls.inlineRadio([
      'OPERATIONAL',
      'UNDERMAINTENANCE',
      'DEGRADEDPERFORMANCE',
      'PARTIALOUTAGE',
      'MAJOROUTAGE',
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
        json: () => Promise.resolve({ page: { status: args.status }, activeIncidents: [args] }),
      } as Response);

    return <Story />;
  },
];
