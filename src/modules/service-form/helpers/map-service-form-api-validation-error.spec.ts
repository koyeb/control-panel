import { describe, expect, it } from 'vitest';

import { identity } from 'src/utils/generic';
import { toObject } from 'src/utils/object';

import { mapServiceFormApiValidationError } from './map-service-form-api-validation-error';

describe('mapServiceFormApiValidationError', () => {
  const test = ({ fields: fieldNames, expected }: { fields: string[]; expected: Record<string, string> }) => {
    const fields = toObject(fieldNames, (field) => `definition.${field}`, identity);

    const unhandledFields = fieldNames
      .filter((field) => !Object.values(expected).includes(field))
      .map((field) => ({ name: `definition.${field}`, message: field }));

    const result = mapServiceFormApiValidationError(fields);

    expect(result[0], 'Expected fields mismatch').toEqual(expected);
    expect(result[1], 'Unhandled fields mismatch').toEqual(unhandledFields);
  };

  it('git', () => {
    test({
      fields: [
        'git.repository',
        'git.branch',
        'git.tag',
        'git.sha',
        'git.build_command',
        'git.run_command',
        'git.no_deploy_on_push',
        'git.workdir',
        'git.buildpack.build_command',
        'git.buildpack.run_command',
        'git.buildpack.privileged',
        'git.docker.dockerfile',
        'git.docker.entrypoint',
        'git.docker.command',
        'git.docker.args',
        'git.docker.target',
        'git.docker.privileged',
      ],
      expected: {
        'source.git.organizationRepository.repositoryName': 'git.repository',
        'source.git.organizationRepository.branch': 'git.branch',
        'source.git.workDirectory': 'git.workdir',
        'builder.buildpackOptions.buildCommand': 'git.buildpack.build_command',
        'builder.buildpackOptions.runCommand': 'git.buildpack.run_command',
        'builder.dockerfileOptions.dockerfile': 'git.docker.dockerfile',
        'builder.dockerfileOptions.entrypoint': 'git.docker.entrypoint',
        'builder.dockerfileOptions.command': 'git.docker.command',
        'builder.dockerfileOptions.args': 'git.docker.args',
        'builder.dockerfileOptions.target': 'git.docker.target',
      },
    });
  });

  it('docker', () => {
    test({
      fields: [
        'docker.image',
        'docker.command',
        'docker.args',
        'docker.image_registry_secret',
        'docker.entrypoint',
        'docker.privileged',
      ],
      expected: {
        'source.docker.image': 'docker.image',
        'source.docker.registrySecret': 'docker.image_registry_secret',
        'dockerDeployment.entrypoint': 'docker.entrypoint',
        'dockerDeployment.command': 'docker.command',
        'dockerDeployment.args': 'docker.args',
      },
    });
  });

  it('environment variable', () => {
    test({
      fields: ['env.0.key', 'env.0.value'],
      expected: {
        'environmentVariables.0.name': 'env.0.key',
        'environmentVariables.0.value': 'env.0.value',
      },
    });

    test({
      fields: ['env.0.secret'],
      expected: { 'environmentVariables.0.value': 'env.0.secret' },
    });

    test({
      fields: ['env.0.scopes'],
      expected: { 'environmentVariables.0.name': 'env.0.scopes' },
    });
  });

  it('ports', () => {
    test({
      fields: ['routes.0.path', 'ports.0.port', 'ports.0.protocol'],
      expected: {
        'ports.0.portNumber': 'ports.0.port',
        'ports.0.path': 'routes.0.path',
      },
    });

    test({
      fields: ['routes.0.port'],
      expected: { 'ports.0.portNumber': 'routes.0.port' },
    });
  });

  it('scaling', () => {
    test({
      fields: [
        'scalings.0.min',
        'scalings.0.max',
        'scalings.0.targets.0.average_cpu.value',
        'scalings.0.targets.0.average_mem.value',
        'scalings.0.targets.0.requests_per_second.value',
        'scalings.0.targets.0.concurrent_requests.value',
        'scalings.0.targets.0.requests_response_time.value',
        'scalings.0.targets.scalings.targets',
      ],
      expected: {
        'scaling.targets.cpu.value': 'scalings.0.targets.0.average_cpu.value',
        'scaling.targets.memory.value': 'scalings.0.targets.0.average_mem.value',
        'scaling.targets.requests.value': 'scalings.0.targets.0.requests_per_second.value',
        'scaling.targets.concurrentRequests.value': 'scalings.0.targets.0.concurrent_requests.value',
        'scaling.targets.responseTime.value': 'scalings.0.targets.0.requests_response_time.value',
        'scaling.targets': 'scalings.0.targets.scalings.targets',
      },
    });
  });

  it('health checks', () => {
    test({
      fields: [
        'health_checks.0.grace_period',
        'health_checks.0.interval',
        'health_checks.0.restart_limit',
        'health_checks.0.timeout',
        'health_checks.0.tcp.port',
        'health_checks.0.http.port',
        'health_checks.0.http.path',
        'health_checks.0.http.method',
        'health_checks.0.http.headers.0.key',
        'health_checks.0.http.headers.0.value',
      ],
      expected: {
        'ports.0.healthCheck.gracePeriod': 'health_checks.0.grace_period',
        'ports.0.healthCheck.interval': 'health_checks.0.interval',
        'ports.0.healthCheck.restartLimit': 'health_checks.0.restart_limit',
        'ports.0.healthCheck.timeout': 'health_checks.0.timeout',
        'ports.0.healthCheck.method': 'health_checks.0.http.method',
        'ports.0.healthCheck.path': 'health_checks.0.http.path',
        'ports.0.healthCheck.header.0.name': 'health_checks.0.http.headers.0.key',
        'ports.0.healthCheck.header.0.value': 'health_checks.0.http.headers.0.value',
      },
    });
  });

  it('service name', () => {
    test({
      fields: ['name'],
      expected: { serviceName: 'name' },
    });
  });

  it('other unhandled fields', () => {
    test({
      fields: ['type', 'regions', 'instance_types.0.type', 'skip_cache'],
      expected: {},
    });
  });
});
