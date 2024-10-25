import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';

import { ApiError } from 'src/api/api-errors';
import { ApiMock } from 'src/api/mock/mock-api';
import { OrganizationPlan } from 'src/api/model';
import { controls } from 'src/storybook';

import { ServiceForm } from './service-form';

type Args = {
  organizationPlan: OrganizationPlan;
  freeInstanceUsed: boolean;
  hasGithubApp: boolean;
  loadingRepositories: boolean;
  verifyDockerImageError: boolean;
};

export default {
  title: 'Modules/ServiceForm',
  parameters: { mockApi, className: 'max-w-main' },
  args: {
    organizationPlan: 'starter',
    freeInstanceUsed: false,
    hasGithubApp: true,
    loadingRepositories: false,
    verifyDockerImageError: false,
  },
  argTypes: {
    organizationPlan: controls.inlineRadio(['hobby', 'starter']),
  },
} satisfies Meta<Args>;

export const serviceForm: StoryFn = (_) => <ServiceForm onDeployed={action('onSubmitted')} />;

function mockApi(args: Args) {
  const api = new ApiMock();
  const data = api.data;

  data.organization.plan = args.organizationPlan;

  if (args.freeInstanceUsed) {
    data.organizationSummary.instances!.by_type!.free = '1';
  }

  if (!args.hasGithubApp) {
    api.mockEndpoint('getGithubApp', () => {
      throw new ApiError({ status: 404, code: '', message: '' });
    });
  }

  if (args.loadingRepositories) {
    api.mockEndpoint('listRepositories', () => new Promise<never>(() => {}));
  }

  if (args.verifyDockerImageError) {
    api.mockEndpoint('verifyDockerImage', () => ({
      success: false,
      code: 'ANON_NOT_FOUND',
      reason: 'Docker image not found',
    }));
  }
}
