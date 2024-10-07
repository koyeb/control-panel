import { createDate } from 'src/utils/date';
import { createFactory } from 'src/utils/factories';
import { createId } from 'src/utils/strings';

import {
  ApiApp,
  ApiCatalogDatacenters,
  ApiCatalogInstance,
  ApiCatalogRegion,
  ApiDeployment,
  ApiDeploymentDefinition,
  ApiGithubInstallation,
  ApiInstance,
  ApiPersistentVolume,
  ApiRepository,
  ApiSecret,
  ApiService,
} from '../api-types';

export const createApiRepository = createFactory<ApiRepository>(() => ({
  id: createId(),
  name: '',
  url: '',
  is_private: false,
  default_branch: '',
  last_push_date: createDate(),
}));

export const createApiGithubApp = createFactory<ApiGithubInstallation>(() => ({
  installation_id: createId(),
  installation_url: '',
  name: '',
  indexing_status: 'COMPLETED',
  indexed_repositories: 0,
  total_repositories: 0,
}));

export const createApiVolume = createFactory<ApiPersistentVolume>(() => ({
  id: createId(),
  status: 'PERSISTENT_VOLUME_STATUS_DETACHED',
  name: '',
}));

export const createApiSecret = createFactory<ApiSecret>(() => ({
  id: createId(),
  name: '',
  type: 'SIMPLE',
}));

export const createApiRegion = createFactory<ApiCatalogRegion>(() => ({
  id: createId(),
  name: '',
  status: 'AVAILABLE',
}));

export const createApiDatacenter = createFactory<ApiCatalogDatacenters>(() => ({
  id: createId(),
  name: '',
  domain: '',
}));

export const createApiCatalogInstance = createFactory<ApiCatalogInstance>(() => ({
  id: createId(),
  display_name: '',
  status: 'AVAILABLE',
  type: 'standard',
  require_plan: [],
  regions: [],
  vcpu_shares: 0,
  memory: '',
  disk: '',
  price_monthly: '',
  price_hourly: '',
  price_per_second: '',
}));

export const createApiApp = createFactory<ApiApp>(() => ({
  id: createId(),
  status: 'HEALTHY',
  domains: [{ id: createId(), type: 'AUTOASSIGNED', name: '' }],
}));

export const createApiService = createFactory<ApiService>(() => ({
  id: createId(),
  app_id: createId(),
  status: 'HEALTHY',
  latest_deployment_id: createId(),
  type: 'WEB',
  name: '',
}));

export const createApiDeployment = createFactory<ApiDeployment>(() => ({
  id: createId(),
  app_id: createId(),
  service_id: createId(),
  status: 'HEALTHY',
  definition: createApiDeploymentDefinition(),
  created_at: createDate(),
}));

export const createApiDeploymentDefinition = createFactory<ApiDeploymentDefinition>(() => ({
  type: 'WEB',
  strategy: { type: 'DEPLOYMENT_STRATEGY_TYPE_BLUE_GREEN' },
  instance_types: [{ type: '' }],
  scalings: [{ min: 0, max: 0 }],
  regions: [],
  env: [],
  ports: [],
  routes: [],
  health_checks: [],
  volumes: [],
}));

export const createApiInstance = createFactory<ApiInstance>(() => ({
  id: createId(),
  status: 'HEALTHY',
  messages: [],
}));
