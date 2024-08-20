import { describe, expect, it } from 'vitest';

import { ApiDeploymentDefinition } from 'src/api/api-types';

import { HealthCheck } from '../service-form.types';

import { deploymentDefinitionToServiceForm } from './deployment-to-service-form';

describe('deploymentDefinitionToServiceForm', () => {
  it('autoscaling', () => {
    const definition: ApiDeploymentDefinition = {
      scalings: [
        {
          min: 1,
          max: 2,
          targets: [{ average_mem: { value: 1000 } }],
        },
      ],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined)).toHaveProperty(
      'scaling.autoscaling.targets',
      {
        cpu: { enabled: false, value: undefined },
        memory: { enabled: true, value: 1000 },
        requests: { enabled: false, value: undefined },
        concurrentRequests: { enabled: false, value: undefined },
        responseTime: { enabled: false, value: undefined },
      },
    );
  });

  it('autoscaling min = 0 and max = 1', () => {
    const definition: ApiDeploymentDefinition = {
      scalings: [{ min: 0, max: 1 }],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined)).toHaveProperty(
      'scaling.autoscaling.targets',
      {
        cpu: { enabled: false },
        memory: { enabled: false },
        requests: { enabled: false },
        concurrentRequests: { enabled: false },
        responseTime: { enabled: false },
      },
    );
  });

  it('port health check', () => {
    const definition: ApiDeploymentDefinition = {
      type: 'WEB',
      ports: [{ port: 1 }],
      health_checks: [
        {
          http: { port: 1, path: '/path', method: 'GET', headers: [{ key: 'name', value: 'value' }] },
          grace_period: 2,
        },
      ],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined)).toHaveProperty(
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
    const definition: ApiDeploymentDefinition = {
      type: 'WEB',
      ports: [{ port: 1 }],
      health_checks: [],
    };

    expect(deploymentDefinitionToServiceForm(definition, undefined)).toHaveProperty(
      'ports.0.healthCheck',
      expect.objectContaining<Partial<HealthCheck>>({
        protocol: 'tcp',
        gracePeriod: 5,
      }),
    );
  });
});
