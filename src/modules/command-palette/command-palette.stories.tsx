import type { Meta, StoryFn } from '@storybook/react';

import { ApiError } from 'src/api/api-errors';
import { ApiMock } from 'src/api/mock/mock-api';

import { CommandPalette } from './command-palette';

type Args = {
  hasGithubApp: boolean;
  verifyDockerImageError: boolean;
};

export default {
  title: 'Modules/CommandPalette',
  parameters: {
    layout: 'centered',
    mockApi,
  },
  args: {
    hasGithubApp: true,
    verifyDockerImageError: false,
  },
  decorators: [
    (Story) => (
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      <div className="h-[400px] w-[680px] overflow-hidden rounded-lg border bg-popover shadow-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<Args>;

export const commandPalette: StoryFn = (_) => {
  return <CommandPalette />;
};

function mockApi(args: Args) {
  const api = new ApiMock();

  if (!args.hasGithubApp) {
    api.mockEndpoint('getGithubApp', () => {
      throw new ApiError({ status: 404, code: '', message: '' });
    });
  }

  if (args.verifyDockerImageError) {
    api.mockEndpoint('verifyDockerImage', () => ({
      success: false,
      code: 'ANON_NOT_FOUND',
      reason: 'Docker image not found',
    }));
  }
}
