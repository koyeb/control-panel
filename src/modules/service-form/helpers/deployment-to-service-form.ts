import merge from 'lodash-es/merge';

import { Api } from 'src/api/api-types';
import { EnvironmentVariable, ServiceType } from 'src/api/model';
import { AssertionError, assert } from 'src/utils/assert';
import { hasProperty, keys } from 'src/utils/object';
import { DeepPartial } from 'src/utils/types';

import {
  Builder,
  DockerDeploymentOptions,
  DockerSource,
  File,
  GitSource,
  HealthCheck,
  Port,
  PortProtocol,
  Scaling,
  ServiceForm,
  ServiceVolume,
} from '../service-form.types';

import { defaultHealthCheck } from './initialize-service-form';

export function deploymentDefinitionToServiceForm(
  definition: Api.DeploymentDefinition,
  githubOrganization: string | undefined,
  apiVolumes: Api.PersistentVolume[],
): DeepPartial<ServiceForm> {
  return {
    serviceName: definition.name,
    serviceType: serviceType(definition),
    source: source(definition, githubOrganization),
    builder: builder(definition),
    dockerDeployment: dockerDeployment(definition),
    regions: definition.regions,
    instance: definition.instance_types?.[0]?.type,
    scaling: scaling(definition),
    environmentVariables: environmentVariables(definition),
    ports: ports(definition),
    volumes: volumes(definition, apiVolumes),
    files: files(definition),
  };
}

function serviceType(definition: Api.DeploymentDefinition): ServiceType | undefined {
  if (definition.type === 'WEB') return 'web';
  if (definition.type === 'WORKER') return 'worker';
}

function source(
  definition: Api.DeploymentDefinition,
  githubOrganization: string | undefined,
): DeepPartial<ServiceForm['source']> | undefined {
  if (definition.archive) {
    return {
      type: 'archive',
      archive: {
        archiveId: definition.archive.id,
      },
    };
  }

  if (definition.git) {
    const repositoryName = definition.git.repository?.replace(/^github.com\//, '') ?? '';

    const git: DeepPartial<GitSource> = {
      workDirectory: getString(definition.git.workdir),
    };

    if (githubOrganization && repositoryName.startsWith(githubOrganization + '/')) {
      git.repositoryType = 'organization';
      git.organizationRepository = {
        repositoryName,
        branch: definition.git.branch,
        autoDeploy: !definition.git.no_deploy_on_push,
      };
    } else {
      git.repositoryType = 'public';
      git.publicRepository = {
        repositoryName,
        branch: definition.git.branch,
      };
    }

    return {
      type: 'git',
      git,
    };
  }

  if (definition.docker) {
    const docker = definition.docker;

    return {
      type: 'docker',
      docker: {
        image: docker.image,
        registrySecret: getString(docker.image_registry_secret),
      } satisfies Partial<DockerSource>,
    };
  }
}

function builder(definition: Api.DeploymentDefinition): DeepPartial<Builder> | undefined {
  const git = definition.git;
  const archive = definition.archive;
  const source = git ?? archive;

  if (!source) {
    return;
  }

  if (source.buildpack) {
    const buildpack = source.buildpack;

    return {
      type: 'buildpack',
      buildpackOptions: {
        buildCommand: getString(buildpack.build_command) ?? getString(git?.build_command),
        runCommand: getString(buildpack.run_command) ?? getString(git?.run_command),
        privileged: source.buildpack.privileged,
      },
    };
  }

  if (source.docker) {
    const docker = source.docker;

    return {
      type: 'dockerfile',
      dockerfileOptions: {
        dockerfile: getString(docker.dockerfile),
        entrypoint: getStringArray(docker.entrypoint),
        command: getString(docker.command),
        args: getStringArray(docker.args),
        target: getString(docker.target),
        privileged: docker.privileged,
      },
    };
  }
}

function dockerDeployment(
  definition: Api.DeploymentDefinition,
): Partial<DockerDeploymentOptions> | undefined {
  const docker = definition.docker;

  if (!docker) {
    return;
  }

  return {
    entrypoint: getStringArray(docker.entrypoint),
    command: getString(docker.command),
    args: getStringArray(docker.args),
    privileged: docker.privileged,
  };
}

function scaling(definition: Api.DeploymentDefinition): DeepPartial<Scaling> {
  const { min, max, targets } = definition.scalings?.[0] ?? {};

  const getTarget = (name: keyof Api.DeploymentScalingTarget) => {
    return targets?.find((target) => name in target) ?? {};
  };

  const { average_cpu } = getTarget('average_cpu');
  const { average_mem } = getTarget('average_mem');
  const { requests_per_second } = getTarget('requests_per_second');
  const { concurrent_requests } = getTarget('concurrent_requests');
  const { requests_response_time } = getTarget('requests_response_time');
  const { sleep_idle_delay } = getTarget('sleep_idle_delay');

  const scaling = {
    min,
    max,
    targets: {
      cpu: {
        enabled: average_cpu !== undefined,
        value: average_cpu?.value,
      },
      memory: {
        enabled: average_mem !== undefined,
        value: average_mem?.value,
      },
      requests: {
        enabled: requests_per_second !== undefined,
        value: requests_per_second?.value,
      },
      concurrentRequests: {
        enabled: concurrent_requests !== undefined,
        value: concurrent_requests?.value,
      },
      responseTime: {
        enabled: requests_response_time !== undefined,
        value: requests_response_time?.value,
      },
      sleepIdleDelay: {
        enabled: min === 0,
        value: sleep_idle_delay?.value,
      },
    },
  } satisfies DeepPartial<Scaling>;

  if (scaling.min === 0 && scaling.max === 1) {
    for (const target of keys(scaling.targets)) {
      if (target !== 'sleepIdleDelay') {
        scaling.targets[target].enabled = false;
      }
    }
  }

  return scaling;
}

function environmentVariables(
  definition: Api.DeploymentDefinition,
): Array<DeepPartial<EnvironmentVariable>> | undefined {
  return definition.env?.map((variable) => ({
    name: variable.key,
    value: variable.value ?? `{{ secret.${variable.secret} }}`,
    regions: variable.scopes
      ?.filter((scope) => scope.startsWith('region:'))
      .map((scope) => scope.replace(/^region:/, '')),
  }));
}

function files(definition: Api.DeploymentDefinition): Array<Partial<File>> | undefined {
  return definition.config_files?.map((file) => ({
    mountPath: file.path,
    permissions: file.permissions,
    content: file.content,
  }));
}

function ports(definition: Api.DeploymentDefinition): Array<DeepPartial<Port>> | undefined {
  return definition.ports?.map((port) => ({
    portNumber: port.port,
    protocol: port.protocol as PortProtocol,
    public: port.protocol !== 'tcp',
    proxy: definition.proxy_ports?.find((proxyPort) => proxyPort.port === port.port) !== undefined,
    path: definition.routes?.find((route) => route.port === port.port)?.path,
    healthCheck: healthCheck(definition, port),
  }));
}

function healthCheck(definition: Api.DeploymentDefinition, port: Api.Port): HealthCheck {
  const healthCheck = definition.health_checks?.find(
    ({ tcp, http }) => tcp?.port === port.port || http?.port === port.port,
  );

  if (!healthCheck) {
    return defaultHealthCheck();
  }

  return merge(defaultHealthCheck(), {
    protocol: 'tcp' in healthCheck ? 'tcp' : 'http',
    gracePeriod: healthCheck.grace_period,
    interval: healthCheck.interval,
    restartLimit: healthCheck.restart_limit,
    timeout: healthCheck.timeout,
    method: healthCheck.http?.method?.toLowerCase(),
    path: healthCheck.http?.path,
    headers: healthCheck.http?.headers?.map((header) => ({
      name: header.key,
      value: header.value,
    })),
  });
}

function volumes(
  definition: Api.DeploymentDefinition,
  apiVolumes: Api.PersistentVolume[],
): Array<DeepPartial<ServiceVolume>> | undefined {
  return definition.volumes?.map(({ id, path }) => {
    const volume = apiVolumes.find(hasProperty('id', id));

    assert(volume !== undefined, new AssertionError(`Cannot find volume ${id}`));

    return {
      volumeId: volume.id,
      name: volume.name,
      size: volume.cur_size,
      mountPath: path,
      mounted: true,
    };
  });
}

// gRPC considers empty strings and arrays as unset
function getString(value: string | undefined): string | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return value;
}

function getStringArray(value: string[] | undefined): string[] | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }

  return value;
}
