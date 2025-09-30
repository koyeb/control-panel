import posthog from 'posthog-js';

import { API } from 'src/api';
import { EnvironmentVariable } from 'src/model';

import {
  ArchiveSource,
  Builder,
  DockerDeploymentOptions,
  DockerSource,
  File,
  GitSource,
  Port,
  Scaling,
  ServiceForm,
  ServiceVolume,
} from '../service-form.types';

import { getDeepSleepValue, getLightSleepValue } from './scaling-rules';

export function serviceFormToDeploymentDefinition(form: ServiceForm): API.DeploymentDefinition {
  return {
    name: form.serviceName,
    type: form.serviceType === 'web' ? 'WEB' : 'WORKER',
    archive: form.source.type === 'archive' ? archive(form.source.archive, form.builder) : undefined,
    git: form.source.type === 'git' ? git(form.source.git, form.builder) : undefined,
    docker: form.source.type === 'docker' ? docker(form.source.docker, form.dockerDeployment) : undefined,
    regions: form.regions,
    instance_types: [{ type: form.instance ?? '' }],
    scalings: scalings(form.scaling),
    env: env(form.environmentVariables),
    config_files: files(form.files),
    volumes: volumes(form.volumes),
    ...(form.serviceType === 'web' && {
      ports: ports(form.ports),
      proxy_ports: proxyPorts(form.ports),
      routes: routes(form.ports),
      health_checks: healthChecks(form.ports),
    }),
    ...form.meta.proxyFields,
  };
}

function archive(archive: ArchiveSource, builder: Builder): API.ArchiveSource {
  return {
    id: archive.archiveId,
    buildpack: builder.type === 'buildpack' ? buildpack(builder) : undefined,
    docker: builder.type === 'dockerfile' ? dockerfile(builder) : undefined,
  };
}

function git(git: GitSource, builder: Builder): API.GitSource {
  const common: API.GitSource = {
    workdir: git.workDirectory ?? undefined,
    buildpack: builder.type === 'buildpack' ? buildpack(builder) : undefined,
    docker: builder.type === 'dockerfile' ? dockerfile(builder) : undefined,
  };

  if (git.repositoryType === 'organization') {
    return {
      repository: `github.com/${git.organizationRepository.repositoryName ?? ''}`,
      branch: git.organizationRepository.branch ?? '',
      no_deploy_on_push: !git.organizationRepository.autoDeploy,
      ...common,
    };
  }

  return {
    repository: `github.com/${git.publicRepository.repositoryName ?? ''}`,
    branch: git.publicRepository.branch ?? '',
    ...common,
  };
}

function buildpack({ buildpackOptions }: Builder): API.BuildpackBuilder {
  return {
    build_command: buildpackOptions.buildCommand ?? undefined,
    run_command: buildpackOptions.runCommand ?? undefined,
    privileged: buildpackOptions.privileged,
  };
}

function dockerfile({ dockerfileOptions }: Builder): API.DockerBuilder {
  return {
    dockerfile: dockerfileOptions.dockerfile ?? undefined,
    entrypoint: dockerfileOptions.entrypoint ?? undefined,
    command: dockerfileOptions.command ?? undefined,
    args: dockerfileOptions.args ?? undefined,
    target: dockerfileOptions.target ?? undefined,
    privileged: dockerfileOptions.privileged,
  };
}

function docker(docker: DockerSource, options: DockerDeploymentOptions): API.DockerSource {
  return {
    image: docker.image,
    command: options.command ?? undefined,
    args: options.args ?? undefined,
    image_registry_secret: docker.registrySecret ?? undefined,
    entrypoint: options.entrypoint ?? undefined,
    privileged: options.privileged,
  };
}

function scalings(scaling: Scaling): Array<API.DeploymentScaling> {
  if (scaling.min === scaling.max) {
    return [{ min: scaling.min, max: scaling.max }];
  }

  const targets = new Array<API.DeploymentScalingTarget>();

  if (scaling.targets.cpu.enabled) {
    targets.push({ average_cpu: { value: scaling.targets.cpu.value } });
  }

  if (scaling.targets.memory.enabled) {
    targets.push({ average_mem: { value: scaling.targets.memory.value } });
  }

  if (scaling.targets.requests.enabled) {
    targets.push({ requests_per_second: { value: scaling.targets.requests.value } });
  }

  if (scaling.targets.concurrentRequests.enabled) {
    targets.push({ concurrent_requests: { value: scaling.targets.concurrentRequests.value } });
  }

  if (scaling.targets.responseTime.enabled) {
    targets.push({ requests_response_time: { value: scaling.targets.responseTime.value, quantile: 95 } });
  }

  if (scaling.min === 0) {
    const target: API.DeploymentScalingTarget['sleep_idle_delay'] = {};

    targets.push({ sleep_idle_delay: target });

    target.deep_sleep_value = getDeepSleepValue(scaling.scaleToZero);
    target.light_sleep_value = getLightSleepValue(scaling.scaleToZero);
  }

  return [
    {
      min: scaling.min,
      max: scaling.max,
      targets,
    },
  ];
}

function env(variables: Array<EnvironmentVariable>): Array<API.DeploymentEnv> {
  const hasEnvScopes = posthog.featureFlags.isFeatureEnabled('environment-variable-scopes');

  return variables.map((variable) => ({
    key: variable.name,
    value: variable.value,
    scopes:
      hasEnvScopes && variable.regions.length > 0
        ? variable.regions.map((regionId) => `region:${regionId}`)
        : undefined,
  }));
}

function files(files: Array<File>): Array<API.DeploymentConfigFile> {
  return files.map(
    (file): API.DeploymentConfigFile => ({
      path: file.mountPath,
      content: file.content,
      permissions: file.permissions,
    }),
  );
}

function ports(ports: Array<Port>): Array<API.Port> {
  return ports.map(({ portNumber, protocol, public: isPublic }: Port) => {
    return {
      port: Number(portNumber),
      protocol: isPublic ? protocol : 'tcp',
    };
  });
}

function proxyPorts(ports: Array<Port>): Array<API.DeploymentProxyPort> {
  return ports
    .filter((port) => port.tcpProxy)
    .map((port) => ({
      port: port.portNumber,
      protocol: 'tcp',
    }));
}

function routes(ports: Array<Port>): Array<API.Route> {
  return ports
    .map((port): API.Route | undefined => {
      if (!port.public) {
        return;
      }

      return {
        port: Number(port.portNumber),
        path: port.path,
      };
    })
    .filter((value): value is API.Route => value !== undefined);
}

function healthChecks(ports: Array<Port>): Array<API.DeploymentHealthCheck> {
  return ports.map((port): API.DeploymentHealthCheck => {
    const portNumber = Number(port.portNumber);
    const healthCheck = port.healthCheck;

    const tcp = (): API.TCPHealthCheck => ({
      port: portNumber,
    });

    const http = (): API.HTTPHealthCheck => ({
      port: portNumber,
      path: healthCheck.path,
      method: healthCheck.method.toUpperCase(),
      headers: healthCheck.headers.map(({ name, value }) => ({
        key: name,
        value,
      })),
    });

    return {
      grace_period: Number(healthCheck.gracePeriod),
      interval: Number(healthCheck.interval),
      restart_limit: Number(healthCheck.restartLimit),
      timeout: Number(healthCheck.timeout),
      ...(healthCheck.protocol === 'tcp' && { tcp: tcp() }),
      ...(healthCheck.protocol === 'http' && { http: http() }),
    };
  });
}

function volumes(volumes: ServiceVolume[]) {
  return volumes
    .filter((volume) => volume.name !== '')
    .map((volume) => ({
      id: volume.volumeId,
      path: volume.mountPath,
    }));
}
