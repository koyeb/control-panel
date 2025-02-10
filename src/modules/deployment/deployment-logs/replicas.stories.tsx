import { Meta } from '@storybook/react';

import { api } from 'src/api/api';
import { create } from 'src/utils/factories';

import { Replicas } from './replicas';

export default {
  title: 'Components/Replicas',
  parameters: { className: 'max-w-main' },
} satisfies Meta;

api.getServiceMetrics = async () => ({ metrics: [] });

const replica0 = [
  create.deploymentInstance({
    status: 'healthy',
    name: '5fc01ca5',
    region: 'was',
    replicaIndex: 0,
    messages: ['Instance is running on datacenter. All health checks are passing.'],
  }),
  create.deploymentInstance({ status: 'stopped', name: '55f176ec', replicaIndex: 0 }),
  create.deploymentInstance({ status: 'error', name: '38d1347d', replicaIndex: 0 }),
  create.deploymentInstance({ status: 'stopped', name: '44798ca2', replicaIndex: 0 }),
];

const replica1 = [
  create.deploymentInstance({
    status: 'error',
    name: '6c2f2eab',
    region: 'par',
    replicaIndex: 1,
    messages: ['Instance is running on datacenter. All health checks are passing.'],
  }),
  create.deploymentInstance({ status: 'stopped', name: '71e8cd3d', replicaIndex: 1 }),
  create.deploymentInstance({ status: 'stopped', name: 'e883b671', replicaIndex: 1 }),
];

const replica2 = [
  create.deploymentInstance({ status: 'starting', name: 'f867450b', replicaIndex: 2 }),
  create.deploymentInstance({
    status: 'healthy',
    name: '53d0768c',
    replicaIndex: 2,
    region: 'tyo',
    messages: ['Instance is running on datacenter. All health checks are passing.'],
  }),
  create.deploymentInstance({ status: 'error', name: '9f018cc6', replicaIndex: 2 }),
  create.deploymentInstance({ status: 'stopped', name: 'd05f8de6', replicaIndex: 2 }),
  create.deploymentInstance({ status: 'stopped', name: '5d9cbecb', replicaIndex: 2 }),
];

export const replicas = () => <Replicas replicas={[replica0, replica1, replica2]} />;
