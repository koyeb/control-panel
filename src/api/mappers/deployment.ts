import { parseBytes } from 'src/application/memory';
import { inArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { round } from 'src/utils/math';
import { hasProperty } from 'src/utils/object';
import { lowerCase, shortId } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import { ApiDeployment, ApiDeploymentNeonPostgresDatabaseInfo, ApiNeonPostgresDatabase } from '../api-types';
import {
  ComputeDeployment,
  DatabaseDeployment,
  Deployment,
  DeploymentDefinition,
  Instance,
  PortProtocol,
  ComputeDeploymentType,
  PostgresVersion,
} from '../model';

export function mapDeployments({ deployments }: ApiEndpointResult<'listDeployments'>): Deployment[] {
  return deployments!.map(transformDeployment);
}

export function mapDeployment({ deployment }: ApiEndpointResult<'getDeployment'>): Deployment {
  return transformDeployment(deployment!);
}

export function isComputeDeployment(deployment: Deployment | undefined): deployment is ComputeDeployment {
  return deployment !== undefined && 'definition' in deployment;
}

export function isDatabaseDeployment(deployment: Deployment | undefined): deployment is DatabaseDeployment {
  return deployment !== undefined && 'postgresVersion' in deployment;
}

export function mapInstances({ instances }: ApiEndpointResult<'listInstances'>): Instance[] {
  return instances!.map((instance) => ({
    id: instance.id!,
    name: shortId(instance.id)!,
    status: lowerCase(instance.status!),
    type: instance.type!,
    region: instance.region!,
    replicaIndex: instance.replica_index ?? 0,
    messages: instance.messages!,
    createdAt: instance.created_at!,
  }));
}

function transformDeployment(deployment: ApiDeployment): Deployment {
  if (deployment.definition!.type! === 'DATABASE') {
    return transformDatabaseDeployment(deployment);
  }

  return transformComputeDeployment(deployment);
}

function transformComputeDeployment(deployment: ApiDeployment): ComputeDeployment {
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

    return {
      status: lowerCase(stage.status!),
      sha: deployment.provisioning_info?.sha,
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
    };
  };

  const builder = (): DeploymentDefinition['builder'] => {
    const source = definition.git ?? definition.archive;

    if (source?.buildpack !== undefined) {
      return { type: 'buildpack' };
    }

    if (source?.docker !== undefined) {
      return { type: 'dockerfile' };
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
    return definition.env!.map(({ key, value, secret }) => ({
      name: key!,
      value: secret ?? value!,
      type: secret ? 'secret' : 'plaintext',
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
      public: port.protocol !== 'tcp',
      path: definition.routes!.find(hasProperty('port', port.port))?.path,
    }));
  };

  const scaling = (): DeploymentDefinition['scaling'] => {
    const scaling = definition.scalings![0]!;

    if (scaling.min === scaling.max) {
      return {
        type: 'fixed',
        instances: scaling.min!,
      };
    }

    return {
      type: 'autoscaling',
      min: scaling.min!,
      max: scaling.max!,
    };
  };

  const trigger = (): ComputeDeployment['trigger'] => {
    const trigger = deployment?.metadata?.trigger;

    if (deployment?.parent_id === '') {
      return { type: 'initial' };
    }

    if (!trigger) {
      return { type: 'redeploy' };
    }

    if (trigger?.type === 'RESUME') {
      return { type: 'resume' };
    }

    if (trigger?.type === 'GIT') {
      return {
        type: 'git',
        repository: trigger.git!.repository!,
        branch: trigger.git!.branch!,
        commit: {
          sha: trigger.git!.sha!,
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
    status: lowerCase(deployment.status!),
    messages: deployment.messages!,
    buildSkipped: deployment.skip_build,
    build: build(),
    definition: {
      type: type(),
      source: source(),
      builder: builder(),
      privileged: privileged(),
      environmentVariables: environmentVariables(),
      volumes: volumes(),
      instanceType: definition.instance_types![0]!.type!,
      regions: definition.regions!,
      ports: ports(),
      scaling: scaling(),
    },
    trigger: trigger(),
  };
}

function transformDatabaseDeployment(deployment: ApiDeployment): DatabaseDeployment {
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
    status: lowerCase(deployment.status!),
    postgresVersion: definition.pg_version as PostgresVersion,
    region: definition.region!,
    host: info?.server_host,
    instance: definition.instance_type!,
    reachedQuota: info ? quotaReached(info, definition) : undefined,
    roles: definition?.roles?.map((role) => ({ name: role.name!, secretId: getSecretId(role.name!) })),
    databases: definition.databases?.map((database) => ({ name: database.name!, owner: database.owner! })),
    activeTime: {
      used: info ? round(Number(info.active_time_seconds!) / (60 * 60), 1) : undefined,
      max: definition.instance_type === 'free' ? 50 : undefined,
    },
    disk: {
      used: info ? round(Number(info.default_branch_logical_size)) : undefined,
      max: definition.instance_type === 'free' ? parseBytes('1GB') : undefined,
    },
  };
}

function quotaReached(
  info: ApiDeploymentNeonPostgresDatabaseInfo,
  neon: ApiNeonPostgresDatabase,
): DatabaseDeployment['reachedQuota'] {
  if (neon.instance_type !== 'free') {
    return undefined;
  }

  if (Number(info.data_transfer_bytes) >= parseBytes('1GB')) {
    return 'data-transfer';
  }

  if (Number(info.written_data_bytes) >= parseBytes('1GB')) {
    return 'written-data';
  }

  if (Number(info.active_time_seconds) >= 50 * 60 * 60) {
    return 'active-time';
  }

  // we don't know how to check this quota (yet)
  if (false as boolean) {
    return 'storage-size';
  }
}
