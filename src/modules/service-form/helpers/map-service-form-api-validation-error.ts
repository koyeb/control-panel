import { Paths } from 'type-fest';

import { ServiceForm } from '../service-form.types';

type ServiceFormPath = Paths<ServiceForm>;

type UnhandledFieldError = {
  name: string;
  message: string;
};

export function mapServiceFormApiValidationError(
  fields: Record<string, string>,
): [Partial<Record<ServiceFormPath, string>>, Array<UnhandledFieldError>] {
  const result: Partial<Record<ServiceFormPath, string>> = {};
  const unhandled: Array<UnhandledFieldError> = [];

  for (const [fieldName, description] of Object.entries(fields)) {
    const mapped = mapFieldName(fieldName.replace(/^definition./, ''));

    if (mapped !== undefined) {
      result[mapped] = description;
    } else {
      unhandled.push({
        name: fieldName,
        message: description,
      });
    }
  }

  return [result, unhandled];
}

function mapFieldName(field: string): ServiceFormPath | undefined {
  if (field in staticMapping) {
    return staticMapping[field];
  }

  for (const [regexp, value] of regexpMapping) {
    if (regexp.exec(field)) {
      return field.replace(regexp, value) as ServiceFormPath;
    }
  }
}

const staticMapping: Record<string, ServiceFormPath> = {
  name: 'serviceName',
  'git.repository': 'source.git.organizationRepository.repositoryName',
  'git.branch': 'source.git.organizationRepository.branch',
  'git.workdir': 'source.git.workDirectory',
  'git.buildpack.build_command': 'builder.buildpackOptions.buildCommand',
  'git.buildpack.run_command': 'builder.buildpackOptions.runCommand',
  'git.docker.dockerfile': 'builder.dockerfileOptions.dockerfile',
  'git.docker.entrypoint': 'builder.dockerfileOptions.entrypoint',
  'git.docker.command': 'builder.dockerfileOptions.command',
  'git.docker.args': 'builder.dockerfileOptions.args',
  'git.docker.target': 'builder.dockerfileOptions.target',
  'docker.image': 'source.docker.image',
  'docker.image_registry_secret': 'source.docker.registrySecret',
  'docker.entrypoint': 'dockerDeployment.entrypoint',
  'docker.command': 'dockerDeployment.command',
  'docker.args': 'dockerDeployment.args',
  'scalings.0.targets.scalings.targets': 'scaling.targets',
};

const regexpMapping = Object.entries({
  'scalings.0.targets.(\\d+).average_cpu.value': 'scaling.targets.cpu.value',
  'scalings.0.targets.(\\d+).average_mem.value': 'scaling.targets.memory.value',
  'scalings.0.targets.(\\d+).requests_per_second.value': 'scaling.targets.requests.value',
  'scalings.0.targets.(\\d+).concurrent_requests.value': 'scaling.targets.concurrentRequests.value',
  'scalings.0.targets.(\\d+).requests_response_time.value': 'scaling.targets.responseTime.value',
  'env.(\\d+).scopes': 'environmentVariables.$1.name',
  'env.(\\d+).key': 'environmentVariables.$1.name',
  'env.(\\d+).value': 'environmentVariables.$1.value',
  'env.(\\d+).secret': 'environmentVariables.$1.value',
  'config_files.(\\d+).path': 'files.$1.mountPath',
  'config_files.(\\d+).content': 'files.$1.content',
  'routes.(\\d+).port': 'ports.$1.portNumber',
  'routes.(\\d+).path': 'ports.$1.path',
  'ports.(\\d+).port': 'ports.$1.portNumber',
  'ports.(\\d+).path': 'ports.$1.path',
  'health_checks.(\\d+).protocol': 'ports.$1.healthCheck.protocol',
  'health_checks.(\\d+).grace_period': 'ports.$1.healthCheck.gracePeriod',
  'health_checks.(\\d+).interval': 'ports.$1.healthCheck.interval',
  'health_checks.(\\d+).restart_limit': 'ports.$1.healthCheck.restartLimit',
  'health_checks.(\\d+).timeout': 'ports.$1.healthCheck.timeout',
  'health_checks.(\\d+).http.path': 'ports.$1.healthCheck.path',
  'health_checks.(\\d+).http.method': 'ports.$1.healthCheck.method',
  'health_checks.(\\d+).http.headers.(\\d+).key': 'ports.$1.healthCheck.header.$2.name',
  'health_checks.(\\d+).http.headers.(\\d+).value': 'ports.$1.healthCheck.header.$2.value',
  'volumes.(\\d+).name': 'volumes.$1.name',
  'volumes.(\\d+).size': 'volumes.$1.size',
  'volumes.(\\d+).path': 'volumes.$1.mountPath',
}).map(([key, value]) => [new RegExp(`^${key}$`), value] as const);
