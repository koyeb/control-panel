import { Meta, StoryFn } from '@storybook/react';

import { createApiDeployment, createApiDeploymentDefinition } from 'src/api/mock/api-factories';
import { ApiMock } from 'src/api/mock/mock-api';
import { create } from 'src/utils/factories';

import { ServiceItem } from './service-item';

export default {
  title: 'Modules/Home/ServiceItem',
  parameters: { mockApi, className: 'max-w-main pr-96' },
} satisfies Meta;

const app = create.app({
  name: 'my-app',
  domains: [create.appDomain({ name: 'my-app.koyeb.app' })],
});

const service = create.service({
  name: 'my-service',
  status: 'healthy',
  latestDeploymentId: 'deploymentId',
});

export const serviceItem: StoryFn = () => {
  return <ServiceItem app={app} service={service} />;
};

function mockApi() {
  const api = new ApiMock();

  api.data.deployments = [
    createApiDeployment({
      id: 'deploymentId',
      definition: createApiDeploymentDefinition({
        ports: [
          { port: 8000, protocol: 'http' },
          { port: 1234, protocol: 'tcp' },
        ],
        routes: [{ port: 8000, path: '/path' }],
        git: {
          repository: 'github.com/koyeb/example-flask',
        },
        regions: ['fra', 'par'],
      }),
      metadata: {
        trigger: {
          type: 'GIT',
          git: {
            message: 'update code to make a feature work better',
            sha: '826723b1d974cc40c5611b6573d9eedd3e4a1c89',
            repository: 'github.com/koyeb/example-flask',
            branch: 'master',
            sender_avatar_url: 'https://gravatar.com/avatar?d=retro',
            sender_profile_url: 'https://github.com/dev',
            sender_username: 'Dave Loper',
          },
        },
      },
    }),
  ];
}
