import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { Api } from '../api-types';
import { App, Service } from '../model';

export function mapApp(app: Api.App): App {
  return {
    ...snakeToCamelDeep(requiredDeep(app)),
    status: lowerCase(app.status!),
    domains: app.domains!.map((domain) => ({
      ...snakeToCamelDeep(requiredDeep(domain)),
      type: lowerCase(domain.type!),
    })),
  };
}

export function mapService(service: Api.Service): Service {
  return {
    ...snakeToCamelDeep(requiredDeep(service)),
    activeDeploymentId: service.active_deployment_id || undefined,
    lastProvisionedDeploymentId: service.last_provisioned_deployment_id || undefined,
    type: lowerCase(service.type as 'WEB' | 'WORKER' | 'DATABASE'),
    status: lowerCase(service.status!),
    upcomingDeploymentIds: service.state?.desired_deployment?.groups?.[0]?.deployment_ids,
  };
}
