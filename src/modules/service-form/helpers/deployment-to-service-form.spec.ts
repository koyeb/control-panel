import { describe, expect, it } from 'vitest';

import type { API } from 'src/api/api';

import { HealthCheck } from '../service-form.types';

import { deploymentDefinitionToServiceForm } from './deployment-to-service-form';

describe('deploymentDefinitionToServiceForm', () => {
  it('environment variable scopes', () => {
    const definition: API.DeploymentDefinition = {
      env: [
        { key: 'VAR1', value: '', scopes: [] },
        { key: 'VAR2', value: '', scopes: ['region:fra'] },
        { key: 'VAR3', value: '', scopes: ['instance:nano'] },
      ],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty(
      'environmentVariables',
      [
        { name: 'VAR1', value: '', regions: [] },
        { name: 'VAR2', value: '', regions: ['fra'] },
        { name: 'VAR3', value: '', regions: [] },
      ],
    );
  });

  it('fixed scaling', () => {
    const definition: API.DeploymentDefinition = {
      scalings: [{ min: 1, max: 1 }],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty('scaling.min', 1);
    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty('scaling.max', 1);
  });

  it('autoscaling', () => {
    const definition: API.DeploymentDefinition = {
      scalings: [
        {
          min: 1,
          max: 2,
          targets: [{ average_mem: { value: 1000 } }],
        },
      ],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty('scaling.targets', {
      cpu: { enabled: false, value: undefined },
      memory: { enabled: true, value: 1000 },
      requests: { enabled: false, value: undefined },
      concurrentRequests: { enabled: false, value: undefined },
      responseTime: { enabled: false, value: undefined },
    });
  });

  it('autoscaling min = 0 and max = 1', () => {
    const definition: API.DeploymentDefinition = {
      scalings: [
        {
          min: 0,
          max: 1,
          targets: [
            { average_mem: { value: 1000 } },
            { sleep_idle_delay: { light_sleep_value: 1, deep_sleep_value: 2 } },
          ],
        },
      ],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty('scaling', {
      min: 0,
      max: 1,
      scaleToZero: {
        deepSleep: 2,
        lightSleep: { enabled: true, value: 1 },
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      targets: expect.objectContaining({
        memory: { enabled: false, value: 1000 },
      }),
    });
  });

  it('volumes mapping', () => {
    const definition: API.DeploymentDefinition = {
      volumes: [{ id: 'volumeId', path: '/path' }],
    };

    const volumes: API.PersistentVolume[] = [{ id: 'volumeId', name: 'volume-name', cur_size: 10 }];

    expect(deploymentDefinitionToServiceForm(definition, undefined, volumes)).toHaveProperty('volumes', [
      {
        volumeId: 'volumeId',
        name: 'volume-name',
        size: 10,
        mountPath: '/path',
        mounted: true,
      },
    ]);
  });

  it('port health check', () => {
    const definition: API.DeploymentDefinition = {
      type: 'WEB',
      ports: [{ port: 1 }],
      health_checks: [
        {
          http: { port: 1, path: '/path', method: 'GET', headers: [{ key: 'name', value: 'value' }] },
          grace_period: 2,
        },
      ],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty(
      'ports.0.healthCheck',
      expect.objectContaining<Partial<HealthCheck>>({
        protocol: 'http',
        gracePeriod: 2,
        interval: 30,
        path: '/path',
        method: 'get',
        headers: [{ name: 'name', value: 'value' }],
      }),
    );
  });

  it('default health checks', () => {
    const definition: API.DeploymentDefinition = {
      type: 'WEB',
      ports: [{ port: 1 }],
      health_checks: [],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined, [])).toHaveProperty(
      'ports.0.healthCheck',
      expect.objectContaining<Partial<HealthCheck>>({
        protocol: 'tcp',
        gracePeriod: 5,
      }),
    );
  });
});
