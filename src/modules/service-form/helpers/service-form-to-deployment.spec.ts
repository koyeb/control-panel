import { beforeEach, describe, expect, it } from 'vitest';

import type { API } from 'src/api/api';

import { ServiceForm } from '../service-form.types';

import { defaultHealthCheck, defaultServiceForm } from './initialize-service-form';
import { serviceFormToDeploymentDefinition } from './service-form-to-deployment';

describe('serviceFormToDeploymentDefinition', () => {
  let form: ServiceForm;

  beforeEach(() => {
    form = defaultServiceForm();
  });

  it('service form to api deployment definition', () => {
    form.appName = 'name';
    form.serviceName = 'name';
    form.source.git.organizationRepository.repositoryName = 'org/repo';
    form.source.git.organizationRepository.branch = 'branch';
    form.environmentVariables = [];
    form.files = [];

    expect(serviceFormToDeploymentDefinition(form)).toEqual<API.DeploymentDefinition>({
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
      config_files: [],
      ports: [
        {
          port: 8000,
          protocol: 'http',
        },
      ],
      proxy_ports: [],
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

  describe('scale to zero', () => {
    beforeEach(() => {
      form.scaling.min = 0;
      form.scaling.max = 1;

      form.scaling.scaleToZero = {
        idlePeriod: 300,
        lightToDeepPeriod: 300,
        lightSleepEnabled: false,
      };
    });

    it('light sleep', () => {
      expect(serviceFormToDeploymentDefinition(form)).toHaveProperty('scalings[0].targets', [
        { sleep_idle_delay: { deep_sleep_value: 300 } },
      ]);
    });

    it('deep sleep', () => {
      form.scaling.scaleToZero.idlePeriod = 60;
      form.scaling.scaleToZero.lightSleepEnabled = true;

      expect(serviceFormToDeploymentDefinition(form)).toHaveProperty('scalings[0].targets', [
        { sleep_idle_delay: { deep_sleep_value: 360, light_sleep_value: 60 } },
      ]);
    });
  });

  it('autoscaling', () => {
    const form = defaultServiceForm();

    form.scaling.min = 1;
    form.scaling.max = 2;

    form.scaling.targets = {
      cpu: { enabled: true, value: 1 },
      memory: { enabled: true, value: 2 },
      requests: { enabled: true, value: 3 },
      concurrentRequests: { enabled: true, value: 4 },
      responseTime: { enabled: true, value: 5 },
    };

    expect(serviceFormToDeploymentDefinition(form)).toHaveProperty('scalings[0].targets', [
      { average_cpu: { value: 1 } },
      { average_mem: { value: 2 } },
      { requests_per_second: { value: 3 } },
      { concurrent_requests: { value: 4 } },
      { requests_response_time: { value: 5, quantile: 95 } },
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
