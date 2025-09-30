import { Meta, StoryFn } from '@storybook/react-vite';

import { PlatformStatus } from './platform-status';

// cSpell:ignore hasissues undermaintenance degradedperformance partialoutage majoroutage

type Args = {
  name: string;
  status: string;
  impact: string;
};

function inlineRadio<Options extends string>(options: Options[]) {
  return {
    control: 'inline-radio' as const,
    options,
  };
}

export default {
  title: 'Components/PlatformStatus',
  args: {
    name: '',
    status: 'UP',
    impact: 'OPERATIONAL',
  },
  argTypes: {
    name: { control: 'text' },
    status: inlineRadio(['UP', 'HASISSUES', 'UNDERMAINTENANCE']),
    impact: inlineRadio([
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
