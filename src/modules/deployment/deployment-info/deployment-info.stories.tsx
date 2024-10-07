import { Meta } from '@storybook/react';

import { createDate } from 'src/utils/date';
import { create } from 'src/utils/factories';

import { DeploymentInfo } from './deployment-info';

export default {
  title: 'Modules/Deployment/DeploymentInfo',
} satisfies Meta;

const app = create.app({
  name: 'koyeb',
  domains: [create.appDomain({ name: 'app.koyeb.com' })],
});

const service = create.service({
  name: 'api-gateway',
});

const deployment = create.computeDeployment({
  definition: create.deploymentDefinition({
    source: {
      type: 'git',
      repository: 'github.com/koyeb/api',
      branch: 'master',
      autoDeploy: true,
    },
    builder: { type: 'buildpack' },
    privileged: false,
    instanceType: 'large',
    regions: ['was', 'sin', 'par'],
    environmentVariables: [
      create.environmentVariable({ name: 'ANSWER', value: '42' }),
      create.environmentVariable({ name: 'URL', value: 'https://{{ KOYEB_PUBLIC_DOMAIN }}' }),
    ],
    ports: [
      { portNumber: 3000, protocol: 'http2', public: true, path: '/v1' },
      { portNumber: 8000, protocol: 'http', public: true, path: '/' },
      { portNumber: 4242, protocol: 'tcp', public: false },
    ],
  }),
  build: {
    status: 'completed',
    sha: 'a9b839512a1aecbb6c82c1c3e67fdf559b15eea8',
    startedAt: createDate(),
    finishedAt: createDate(),
  },
});

export const deploymentInfo = () => <DeploymentInfo app={app} service={service} deployment={deployment} />;
