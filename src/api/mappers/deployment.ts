import { parseBytes } from 'src/application/memory';
import { inArray, last } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { round } from 'src/utils/math';
import { hasProperty, requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase, removePrefix, shortId } from 'src/utils/strings';

import type { API } from '../api-types';
import {
  ComputeDeployment,
  ComputeDeploymentType,
  DatabaseDeployment,
  Deployment,
  DeploymentBuildStepName,
  DeploymentDefinition,
  Instance,
  PortProtocol,
  PostgresVersion,
  RegionalDeployment,
  Replica,
} from '../model';

export function mapDeployment(deployment: API.Deployment): Deployment {
  if (deployment.definition!.type === 'DATABASE') {
    return mapDatabaseDeployment(deployment);
  }

  return mapComputeDeployment(deployment);
}

export function mapRegionalDeployment(deployment: API.RegionalDeployment): RegionalDeployment {
  return snakeToCamelDeep(requiredDeep(deployment));
}

export function isComputeDeployment(deployment: Deployment | undefined): deployment is ComputeDeployment {
  return deployment !== undefined && 'definition' in deployment;
}

export function isDatabaseDeployment(deployment: Deployment | undefined): deployment is DatabaseDeployment {
  return deployment !== undefined && 'postgresVersion' in deployment;
}

export function mapInstance(instance: API.Instance): Instance {
  return {
    ...snakeToCamelDeep(requiredDeep(instance)),
    name: shortId(instance.id)!,
  };
}

export function mapReplica(replica: API.GetDeploymentScalingReplyItem): Replica {
  const instance = replica.instances?.find(hasProperty('status', 'HEALTHY')) ?? replica.instances?.[0];

  return {
    index: replica.replica_index!,
    region: replica.region!,
    instances: replica.instances!.map(mapInstance),
    ...(instance && {
      instanceId: instance.id,
      status: instance.status!,
      messages: instance.messages!,
    }),
  };
}

function mapComputeDeployment(deployment: API.Deployment): ComputeDeployment {
  const definition = deployment.definition!;

  const type = (): ComputeDeploymentType => {
    const type = definition.type;

    if (!inArray(type, ['WEB', 'WORKER'] as const)) {
      throw new Error(`Invalid deployment type "${type}"`);
    }

    return lowerCase(type);
  };

  const build = (): ComputeDeployment['build'] => {
    const stages = deployment.provisioning_info?.stages;
    const stage = stages?.[stages.length - 1];

    if (!stage) {
      return undefined;
    }

    const steps = () => {
      const steps = last(stage.build_attempts ?? [])?.steps ?? [];

      if (steps.length === 0) {
        return;
      }

      return steps.map((step) => ({
        name: step.name! as DeploymentBuildStepName,
        status: step.status!,
        messages: step.messages!,
        startedAt: step.started_at!,
        finishedAt: step.finished_at!,
      }));
    };

    return {
      status: stage.status!,
      sha: deployment.provisioning_info?.sha,
      steps: steps(),
      // the API actually returns null
      startedAt: stage.started_at!,
      finishedAt: stage.finished_at!,
    };
  };

  const source = (): DeploymentDefinition['source'] => {
    const { archive, git, docker } = definition;

    if (archive !== undefined) {
      return {
        type: 'archive',
        archiveId: archive.id!,
      };
    }

    if (git !== undefined) {
      return {
        type: 'git',
        repository: git.repository!,
        branch: git.branch!,
        autoDeploy: !git.no_deploy_on_push!,
      };
    }

    assert(docker !== undefined);

    return {
      type: 'docker',
      image: docker.image!,
      entrypoint: getStringArray(docker.entrypoint),
      command: getString(docker.command),
      arguments: getStringArray(docker.args),
    };
  };

  const builder = (): DeploymentDefinition['builder'] => {
    const source = definition.git ?? definition.archive;

    if (source?.buildpack !== undefined) {
      return {
        type: 'buildpack',
        buildCommand: getString(source.buildpack.build_command),
        runCommand: getString(source.buildpack.run_command),
      };
    }

    if (source?.docker !== undefined) {
      return {
        type: 'dockerfile',
        dockerfile: getString(source.docker.dockerfile),
        entrypoint: getStringArray(source.docker.entrypoint),
        command: getString(source.docker.command),
        arguments: getStringArray(source.docker.args),
        target: getString(source.docker.target),
      };
    }
  };

  const privileged = (): DeploymentDefinition['privileged'] => {
    return (
      definition.archive?.buildpack?.privileged ??
      definition.archive?.docker?.privileged ??
      definition.git?.buildpack?.privileged ??
      definition.git?.docker?.privileged ??
      definition.docker?.privileged
    );
  };

  const environmentVariables = (): DeploymentDefinition['environmentVariables'] => {
    const scopesToRegions = (scopes: string[] = []) => {
      return scopes
        .filter((scope) => scope.startsWith('region:'))
        .map((scope) => scope.replace(/^region:/, ''));
    };

    return definition.env!.map(({ key, value, secret, scopes }) => ({
      name: key!,
      value: value ?? `@${secret}`,
      regions: scopesToRegions(scopes),
    }));
  };

  const files = (): DeploymentDefinition['files'] => {
    return definition.config_files!.map(({ path, content }) => ({
      mountPath: path!,
      content: content!,
    }));
  };

  const volumes = (): DeploymentDefinition['volumes'] => {
    return definition.volumes!.map(({ id, path }) => ({
      volumeId: id!,
      mountPath: path!,
    }));
  };

  const ports = (): DeploymentDefinition['ports'] => {
    return definition.ports!.map((port) => ({
      portNumber: port.port!,
      protocol: port.protocol! as PortProtocol,
      path: definition.routes!.find(hasProperty('port', port.port))?.path,
      tcpProxy: definition.proxy_ports!.find(hasProperty('port', port.port)) !== undefined,
    }));
  };

  const scaling = (): DeploymentDefinition['scaling'] => {
    const scaling = definition.scalings![0]!;

    return {
      min: scaling.min!,
      max: scaling.max!,
    };
  };

  const proxyPorts = (): ComputeDeployment['proxyPorts'] => {
    if (deployment.metadata?.proxy_ports !== undefined) {
      return deployment.metadata.proxy_ports.map((proxyPort) => ({
        port: proxyPort.port!,
        publicPort: proxyPort.public_port!,
        host: proxyPort.host!,
      }));
    }

    return [];
  };

  const trigger = (): ComputeDeployment['trigger'] => {
    const trigger = deployment.metadata?.trigger;

    if (deployment.parent_id === '') {
      return { type: 'initial' };
    }

    if (!trigger) {
      return { type: 'redeploy' };
    }

    if (trigger.type === 'RESUME') {
      return { type: 'resume' };
    }

    if (trigger.type === 'GIT') {
      return {
        type: 'git',
        repository: trigger.git!.repository!,
        branch: trigger.git!.branch!,
        commit: {
          sha:
            trigger.git!.sha! === '0000000000000000000000000000000000000000' ? undefined : trigger.git!.sha!,
          message: trigger.git!.message!,
          author: {
            name: trigger.git!.sender_username!,
            url: trigger.git!.sender_profile_url!,
            avatar: trigger.git!.sender_avatar_url!,
          },
        },
      };
    }

    return null;
  };

  return {
    id: deployment.id!,
    appId: deployment.app_id!,
    serviceId: deployment.service_id!,
    name: shortId(deployment.id)!,
    date: deployment.created_at!,
    terminatedAt: deployment.terminated_at!,
    status: deployment.status!,
    messages: deployment.messages!,
    buildSkipped: deployment.skip_build,
    build: build(),
    definition: {
      name: definition.name!,
      type: type(),
      strategy: lowerCase(removePrefix('DEPLOYMENT_STRATEGY_TYPE_', definition.strategy!.type!)),
      source: source(),
      builder: builder(),
      privileged: privileged(),
      environmentVariables: environmentVariables(),
      files: files(),
      volumes: volumes(),
      instanceType: definition.instance_types![0]!.type!,
      regions: definition.regions!,
      ports: ports(),
      scaling: scaling(),
    },
    definitionApi: definition,
    proxyPorts: proxyPorts(),
    trigger: trigger(),
  };
}

function getString(value?: string) {
  return value === '' ? undefined : value;
}

function getStringArray(value?: string[]) {
  return value?.length === 0 ? undefined : value;
}

export const databaseQuotas = {
  maxActiveTime: 50 * 60 * 60, // 50 hours
  maxComputeTime: 5 * 60 * 60, // 5 hours
  maxDataTransfer: parseBytes('1GB'), // 1 GB
  maxWrittenData: parseBytes('1GB'), // 1 GB
  maxStorageSize: parseBytes('1GB'), // 1 GB
};

function mapDatabaseDeployment(deployment: API.Deployment): DatabaseDeployment {
  const definition = deployment.definition!.database!.neon_postgres!;
  const info = deployment.database_info?.neon_postgres;

  const getSecretId = (secretName: string) => {
    return info?.roles?.find(hasProperty('name', secretName))?.secret_id as string;
  };

  return {
    id: deployment.id!,
    appId: deployment.app_id!,
    serviceId: deployment.service_id!,
    name: deployment.definition!.name!,
    status: deployment.status!,
    postgresVersion: definition.pg_version as PostgresVersion,
    region: definition.region!,
    host: info?.server_host,
    instance: definition.instance_type!,
    roles: definition.roles?.map((role) => ({ name: role.name!, secretId: getSecretId(role.name!) })),
    databases: definition.databases?.map((database) => ({ name: database.name!, owner: database.owner! })),
    neonPostgres: info ? snakeToCamelDeep(info) : {},
    activeTime: {
      used: info ? round(Number(info.active_time_seconds!) / (60 * 60), 1) : undefined,
      max: definition.instance_type === 'free' ? databaseQuotas.maxActiveTime : undefined,
    },
    computeTime: {
      used: info ? round(Number(info.compute_time_seconds!) / (60 * 60), 1) : undefined,
      max: definition.instance_type === 'free' ? databaseQuotas.maxComputeTime : undefined,
    },
    disk: {
      used: info ? round(Number(info.default_branch_logical_size)) : undefined,
      max: definition.instance_type === 'free' ? databaseQuotas.maxStorageSize : undefined,
    },
  };
}
