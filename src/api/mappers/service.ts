import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { API } from '../api-types';
import { App, Service } from '../model';

export function mapApp(app: API.App): App {
  return snakeToCamelDeep(requiredDeep(app));
}

export function mapService(service: API.Service): Service {
  return {
    ...snakeToCamelDeep(requiredDeep(service)),
    activeDeploymentId: service.active_deployment_id || undefined,
    lastProvisionedDeploymentId: service.last_provisioned_deployment_id || undefined,
    type: lowerCase(service.type as 'WEB' | 'WORKER' | 'DATABASE'),
    upcomingDeploymentIds: service.state?.desired_deployment?.groups?.[0]?.deployment_ids,
  };
}
