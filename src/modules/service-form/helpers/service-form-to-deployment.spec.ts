import { describe, expect, it } from 'vitest';

import type { Api } from 'src/api/api-types';

import { defaultHealthCheck, defaultServiceForm } from './initialize-service-form';
import { serviceFormToDeploymentDefinition } from './service-form-to-deployment';

describe('serviceFormToDeploymentDefinition', () => {
  it('service form to api deployment definition', () => {
    const form = defaultServiceForm();

    form.appName = 'name';
    form.serviceName = 'name';
    form.source.git.organizationRepository.repositoryName = 'org/repo';
    form.source.git.organizationRepository.branch = 'branch';
    form.environmentVariables = [];
    form.fileMounts = [];

    expect(serviceFormToDeploymentDefinition(form)).toEqual<Api.DeploymentDefinition>({
      name: 'name',
      type: 'WEB',
      git: {
        repository: 'github.com/org/repo',
        branch: 'branch',
        no_deploy_on_push: false,
        buildpack: {
          privileged: false,
        },
      },
      regions: ['fra'],
      instance_types: [{ type: 'nano' }],
      scalings: [{ min: 1, max: 1 }],
      env: [],
      // file_mounts: [],
      ports: [
        {
          port: 8000,
          protocol: 'http',
        },
      ],
      routes: [
        {
          port: 8000,
          path: '/',
        },
      ],
      health_checks: [
        {
          tcp: { port: 8000 },
          grace_period: 5,
          interval: 30,
          restart_limit: 3,
          timeout: 5,
        },
      ],
      volumes: [],
    });
  });

  it('autoscaling', () => {
    const form = defaultServiceForm();

    form.scaling = {
      min: 1,
      max: 2,
      targets: {
        requests: { enabled: true, value: 1 },
        cpu: { enabled: true, value: 1 },
        memory: { enabled: true, value: 1 },
        concurrentRequests: { enabled: true, value: 1 },
        responseTime: { enabled: true, value: 1 },
        sleepIdleDelay: { enabled: true, value: 1 },
      },
    };

    expect(serviceFormToDeploymentDefinition(form)).toHaveProperty('scalings', [
      {
        min: 1,
        max: 2,
        targets: [
          { requests_per_second: { value: 1 } },
          { average_cpu: { value: 1 } },
          { average_mem: { value: 1 } },
          { concurrent_requests: { value: 1 } },
          { requests_response_time: { value: 1, quantile: 95 } },
          { sleep_idle_delay: { value: 1 } },
        ],
      },
    ]);
  });

  it('http health check', () => {
    const form = defaultServiceForm();

    form.serviceName = 'name';
    form.source.git.organizationRepository.repositoryName = 'org/repo';
    form.source.git.organizationRepository.branch = 'branch';

    form.ports[0]!.healthCheck = {
      ...defaultHealthCheck(),
      protocol: 'http',
      path: '/path',
      method: 'connect',
      headers: [{ name: 'name', value: 'value' }],
    };

    expect(serviceFormToDeploymentDefinition(form)).toHaveProperty('health_checks.0', {
      http: {
        port: 8000,
        path: '/path',
        method: 'CONNECT',
        headers: [{ key: 'name', value: 'value' }],
      },
      grace_period: 5,
      interval: 30,
      restart_limit: 3,
      timeout: 5,
    });
  });
});
