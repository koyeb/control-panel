import {
  Activity,
  ActivityObject,
  App,
  AppDomain,
  CatalogDatacenter,
  CatalogInstance,
  CatalogRegion,
  ComputeDeployment,
  DatabaseDeployment,
  DeploymentDefinition,
  EnvironmentVariable,
  GitRepository,
  GithubApp,
  Instance,
  Organization,
  OrganizationQuotas,
  OrganizationSummary,
  Secret,
  Service,
  Volume,
} from 'src/model';

import { createDate } from './date';
import { createId } from './strings';

type Factory<T> = (overrides?: Partial<T>) => T;

export function createFactory<T>(getDefaults: () => T): Factory<T> {
  return (overrides) => ({ ...getDefaults(), ...overrides });
}

const organization = createFactory<Organization>(() => ({
  id: createId(),
  name: '',
  status: 'ACTIVE',
  statusMessage: 'VALID',
  plan: 'no_plan',
  hasSignupQualification: false,
  hasPaymentMethod: false,
  billing: {},
}));

const organizationSummary = createFactory<OrganizationSummary>(() => ({
  freeInstanceUsed: false,
  freeDatabaseUsed: false,
  instancesUsed: {},
}));

const quotas = createFactory<OrganizationQuotas>(() => ({
  maxNumberOfApps: 0,
  maxNumberOfServices: 0,
  maxOrganizationMembers: 0,
  maxInstancesByType: {},
  volumesByRegion: {},
  maxMemory: 0,
  maxDomains: 0,
  logsRetention: 0,
  scaleToZero: {
    isDeepSleepEnabled: false,
    deepSleepIdleDelayMin: 0,
    deepSleepIdleDelayMax: 0,
    isLightSleepEnabled: false,
    lightSleepIdleDelayMin: 0,
    lightSleepIdleDelayMax: 0,
  },
}));

const activity = createFactory<Activity>(() => ({
  id: createId(),
  createdAt: createDate(),
  verb: '',
  actor: {
    name: '',
    type: '',
    metadata: {},
  },
  object: activityObject(),
  metadata: {},
}));

const activityObject = createFactory<ActivityObject>(() => ({
  id: createId(),
  name: '',
  type: '',
  deleted: false,
  metadata: {},
}));

const datacenter = createFactory<CatalogDatacenter>(() => ({
  id: '',
  domain: '',
  regionId: '',
}));

const region = createFactory<CatalogRegion>(() => ({
  id: '',
  name: '',
  status: 'available',
  datacenters: [],
  volumesEnabled: false,
  category: 'koyeb',
  scope: 'metropolitan',
}));

const instance = createFactory<CatalogInstance>(() => ({
  id: '',
  displayName: '',
  status: 'available',
  category: 'standard',
  regionCategory: 'koyeb',
  vcpuShares: 0,
  memory: '',
  disk: '',
  priceMonthly: 0,
  priceHourly: 0,
  pricePerSecond: 0,
  volumesEnabled: false,
}));

const environmentVariable = createFactory<EnvironmentVariable>(() => ({
  name: '',
  value: '',
  regions: [],
}));

const volume = createFactory<Volume>(() => ({
  id: createId(),
  status: 'ATTACHED',
  name: '',
  region: '',
  size: 0,
  createdAt: createDate(),
}));

const simpleSecret = createFactory<Secret>(() => ({
  id: createId(),
  name: '',
  type: 'SIMPLE',
  createdAt: createDate(),
  updatedAt: createDate(),
}));

const githubApp = createFactory<GithubApp>(() => ({
  installationId: '',
  installationUrl: '',
  organizationName: '',
  indexing: false,
  indexingPercent: null,
}));

const repository = createFactory<GitRepository>(() => ({
  id: createId(),
  name: '',
  url: '',
  isPrivate: false,
  defaultBranch: '',
  lastPushDate: '',
  branches: [],
}));

const app = createFactory<App>(() => ({
  id: createId(),
  name: '',
  status: 'HEALTHY',
  domains: [],
}));

const appDomain = createFactory<AppDomain>(() => ({
  id: createId(),
  name: '',
  type: 'AUTOASSIGNED',
}));

const service = createFactory<Service>(() => ({
  id: createId(),
  appId: '',
  latestDeploymentId: '',
  type: 'web',
  name: '',
  status: 'HEALTHY',
  createdAt: createDate(),
}));

const computeDeployment = createFactory<ComputeDeployment>(() => ({
  id: createId(),
  appId: '',
  serviceId: '',
  name: '',
  date: createDate(),
  status: 'HEALTHY',
  messages: [],
  definition: deploymentDefinition(),
  definitionApi: {},
  proxyPorts: [],
  trigger: null,
}));

const deploymentDefinition = createFactory<DeploymentDefinition>(() => ({
  name: '',
  type: 'web',
  strategy: 'rolling',
  source: { type: 'git', repository: '', branch: '', autoDeploy: false },
  environmentVariables: [],
  files: [],
  volumes: [],
  instanceType: '',
  regions: [],
  ports: [],
  scaling: { min: 1, max: 1 },
}));

const deploymentInstance = createFactory<Instance>(() => ({
  id: createId(),
  serviceId: '',
  status: 'HEALTHY',
  name: '',
  region: '',
  type: '',
  replicaIndex: 0,
  createdAt: createDate(),
  terminatedAt: null,
  messages: [],
}));

const databaseDeployment = createFactory<DatabaseDeployment>(() => ({
  id: createId(),
  appId: '',
  serviceId: '',
  name: '',
  date: createDate(),
  status: 'HEALTHY',
  created_at: '',
  postgresVersion: 16,
  region: '',
  instance: '',
  neonPostgres: {},
  activeTime: {},
  computeTime: {},
  disk: {},
}));

export const create = {
  organization,
  organizationSummary,
  quotas,
  activity,
  activityObject,
  datacenter,
  region,
  instance,
  environmentVariable,
  volume,
  simpleSecret,
  githubApp,
  repository,
  app,
  appDomain,
  service,
  computeDeployment,
  deploymentDefinition,
  deploymentInstance,
  databaseDeployment,
};
