import { api } from 'src/api/api';
import type { Api } from 'src/api/api-types';
import { databaseQuotas, isComputeDeployment, isDatabaseDeployment } from 'src/api/mappers/deployment';
import {
  App,
  AppDomain,
  DatabaseDeployment,
  Deployment,
  DeploymentStatus,
  Instance,
  InstanceStatus,
  Port,
  Service,
} from 'src/api/model';
import { routes } from 'src/application/routes';
import { inArray } from 'src/utils/arrays';

import { getToken } from './token';

export function getServiceLink(service: Service) {
  if (service.type === 'database') {
    return routes.database.overview(service.id);
  }

  return routes.service.overview(service.id);
}

export type ServiceUrl = {
  portNumber: number;
  internalUrl?: string;
  externalUrl?: string;
};

export function getServiceUrls(app: App, service: Service, deployment?: Deployment): Array<ServiceUrl> {
  if (isComputeDeployment(deployment)) {
    const firstDomain = app.domains[0];
    const ports = deployment.definition.ports;
    const instanceType = deployment.definition.instanceType;

    if (firstDomain === undefined) {
      return [];
    }

    return ports.map((port): ServiceUrl => {
      return {
        portNumber: port.portNumber,
        internalUrl: internalUrl(service, app, instanceType, port),
        externalUrl: externalUrl(firstDomain, port),
      };
    });
  }

  if (isDatabaseDeployment(deployment) && deployment.host) {
    return [{ portNumber: 5432, internalUrl: deployment.host }];
  }

  return [];
}

function internalUrl(service: Service, app: App, instanceType: string, port: Port) {
  if (instanceType === 'free') {
    return;
  }

  return [service.name, app.name, 'internal'].join('.') + `:${port.portNumber}`;
}

function externalUrl(domain: AppDomain, port: Port) {
  if (port.path !== undefined) {
    return domain.name + port.path;
  }
}

export const upcomingDeploymentStatuses: DeploymentStatus[] = [
  'PENDING',
  'PROVISIONING',
  'SCHEDULED',
  'ALLOCATING',
  'STARTING',
];

export function isUpcomingDeployment({ status }: Deployment) {
  return inArray(status, upcomingDeploymentStatuses);
}

export function hasBuild(deployment?: Deployment) {
  return isComputeDeployment(deployment) && inArray(deployment.definition.source.type, ['git', 'archive']);
}

export function isDeploymentRunning({ status }: Deployment) {
  return inArray<DeploymentStatus>(status, [
    'CANCELING',
    'ALLOCATING',
    'STARTING',
    'HEALTHY',
    'DEGRADED',
    'UNHEALTHY',
    'STOPPING',
    'ERRORING',
  ]);
}

export function isInstanceRunning({ status }: Instance) {
  return inArray<InstanceStatus>(status, ['ALLOCATING', 'STARTING', 'HEALTHY', 'UNHEALTHY', 'STOPPING']);
}

export async function updateDatabaseService(
  serviceId: string,
  updater: (deployment: Api.DeploymentDefinition) => void,
) {
  const token = getToken();

  const { service } = await api.getService({ token, path: { id: serviceId } });
  const { deployment } = await api.getDeployment({ token, path: { id: service!.latest_deployment_id! } });
  const definition = deployment!.definition!;

  updater(definition);

  await api.updateService({
    token,
    path: { id: serviceId },
    query: {},
    body: { definition },
  });
}

export function getDatabaseServiceReachedQuota(service: Service, deployment: DatabaseDeployment) {
  const { instance, neonPostgres } = deployment;

  if (instance !== 'free') {
    return undefined;
  }

  if (Number(neonPostgres.dataTransferBytes) >= databaseQuotas.maxDataTransfer) {
    return 'data-transfer';
  }

  if (Number(neonPostgres.writtenDataBytes) >= databaseQuotas.maxWrittenData) {
    return 'written-data';
  }

  if (Number(neonPostgres.computeTimeSeconds) >= databaseQuotas.maxComputeTime) {
    return 'compute-time';
  }

  // we don't know how to check this quota (yet)
  if (false as boolean) {
    return 'storage-size';
  }
}

export const allApiDeploymentStatuses: Array<Api.DeploymentStatus> = [
  'PENDING',
  'PROVISIONING',
  'SCHEDULED',
  'CANCELING',
  'CANCELED',
  'ALLOCATING',
  'STARTING',
  'HEALTHY',
  'DEGRADED',
  'UNHEALTHY',
  'STOPPING',
  'STOPPED',
  'ERRORING',
  'ERROR',
  'STASHED',
  'SLEEPING',
];
