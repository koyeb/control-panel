import { ApiEndpointResult } from '../api';
import { AppDetails, AppStatus, DomainType, ServiceStatus, ServiceType } from '../model';

import { transformDeployment } from './deployment';

export function mapAppsDetails({ items }: ApiEndpointResult<'listAppsDetails'>): AppDetails[] {
  return items!.map((item) => ({
    id: item.id!,
    name: item.name!,
    status: item.status!.toLowerCase() as AppStatus,
    domains: item.domains!.map((domain) => ({
      id: domain.id!,
      name: domain.name!,
      type: domain.type!.toLowerCase() as DomainType,
    })),
    services: item.services?.map((service) => ({
      id: service.id!,
      appId: service.app_id!,
      latestDeploymentId: service.latest_deployment_id!,
      activeDeploymentId: service.active_deployment_id!,
      type: service.type!.toLowerCase() as ServiceType,
      name: service.name!,
      status: service.status!.toLowerCase() as ServiceStatus,
      upcomingDeploymentIds: [],
      createdAt: service.created_at!,

      latestDeployment:
        service.latest_deployment !== undefined ? transformDeployment(service.latest_deployment) : undefined,
    })),
  }));
}
