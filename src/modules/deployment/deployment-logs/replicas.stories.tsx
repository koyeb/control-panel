import { Meta } from '@storybook/react-vite';

import { ApiPort } from 'src/api/api';
import { Api } from 'src/api/api-types';
import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';
import { create, createFactory } from 'src/utils/factories';
import { createId } from 'src/utils/strings';

import { Replicas } from './replicas';

const api: Partial<ApiPort> = {};

export default {
  title: 'Components/Replicas',
  parameters: { className: 'max-w-main' },
  decorators: (Story) => {
    container.bindValue(TOKENS.api, api);
    return <Story />;
  },
} satisfies Meta;

const createApiInstance = createFactory<Api.Instance>(() => ({
  id: createId(),
  status: 'HEALTHY',
  messages: [],
}));

api.getServiceMetrics = async () => ({ metrics: [] });

api.getDeploymentScaling = async () => ({
  replicas: [
    {
      region: 'was',
      replica_index: 0,
      instances: [
        createApiInstance({ status: 'STARTING', id: '41c7dd2f', messages: ['Instance is starting.'] }),
        createApiInstance({
          status: 'HEALTHY',
          id: '5fc01ca5',
          messages: ['Instance is running on datacenter. All health checks are passing.'],
        }),
        createApiInstance({ status: 'STOPPED', id: '55f176ec' }),
        createApiInstance({ status: 'ERROR', id: '38d1347d' }),
        createApiInstance({ status: 'STOPPED', id: '44798ca2' }),
      ],
    },
    {
      region: 'par',
      replica_index: 0,
      instances: [
        createApiInstance({
          status: 'ERROR',
          id: '6c2f2eab',
          messages: ['Instance is running on datacenter. All health checks are passing.'],
        }),
        createApiInstance({ status: 'STOPPED', id: '71e8cd3d' }),
        createApiInstance({ status: 'STOPPED', id: 'e883b671' }),
      ],
    },
    {
      region: 'tyo',
      replica_index: 0,
      instances: [
        createApiInstance({
          status: 'STARTING',
          id: 'f867450b',
          messages: ['Instance is starting.'],
        }),
        createApiInstance({ status: 'ERROR', id: '9f018cc6' }),
        createApiInstance({ status: 'STOPPED', id: 'd05f8de6' }),
        createApiInstance({ status: 'STOPPED', id: '5d9cbecb' }),
      ],
    },
  ],
});

export const replicas = () => (
  <Replicas
    deployment={create.computeDeployment({
      id: 'deploymentId',
      definition: create.deploymentDefinition({ regions: ['was', 'par', 'tyo'] }),
    })}
  />
);
