import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import { App, Service, ServiceType } from '../model';

export function mapApps({ apps }: ApiEndpointResult<'listApps'>): App[] {
  return apps!.map(transformApp);
}

export function mapApp({ app }: ApiEndpointResult<'getApp'>): App {
  return transformApp(app!);
}

export function mapServices({ services }: ApiEndpointResult<'listServices'>): Service[] {
  return services!.map(transformService);
}

export function mapService({ service }: ApiEndpointResult<'getService'>): Service {
  return transformService(service!);
}

function transformApp(app: Api.App) {
  return {
    id: app.id!,
    name: app.name!,
    status: lowerCase(app.status!),
    domains: app.domains!.map((domain) => ({
      id: domain.id!,
      name: domain.name!,
      type: lowerCase(domain.type!),
    })),
  };
}

function transformService(service: Api.Service): Service {
  return {
    id: service.id!,
    appId: service.app_id!,
    latestDeploymentId: service.latest_deployment_id!,
    activeDeploymentId: service.active_deployment_id || undefined,
    lastProvisionedDeploymentId:
      'last_provisioned_deployment_id' in service ? service.last_provisioned_deployment_id : undefined,
    type: lowerCase(service.type!) as ServiceType,
    name: service.name!,
    status: lowerCase(service.status!),
    upcomingDeploymentIds: service.state?.desired_deployment?.groups?.[0]?.deployment_ids,
    createdAt: service.created_at!,
  };
}
