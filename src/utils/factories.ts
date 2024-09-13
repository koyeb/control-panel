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
} from 'src/api/model';

import { createDate } from './date';
import { createId } from './strings';

export type Factory<T> = (overrides?: Partial<T>) => T;

export function createFactory<T>(getDefaults: () => T): Factory<T> {
  return (overrides) => ({ ...getDefaults(), ...overrides });
}

const organization = createFactory<Organization>(() => ({
  id: createId(),
  name: '',
  status: 'active',
  statusMessage: 'valid',
  plan: 'no_plan',
  hasSignupQualification: false,
  hasPaymentMethod: false,
  billing: {},
}));

const organizationSummary = createFactory<OrganizationSummary>(() => ({
  freeInstanceUsed: false,
  freeDatabaseUsed: false,
}));

const quotas = createFactory<OrganizationQuotas>(() => ({
  maxNumberOfApps: 0,
  maxNumberOfServices: 0,
  maxOrganizationMembers: 0,
  maxInstancesByType: {},
  volumesByRegion: {},
  maxMemory: 0,
  maxDomains: 0,
}));

const activity = createFactory<Activity>(() => ({
  id: createId(),
  date: createDate(),
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
  identifier: '',
  domain: '',
  regionIdentifier: '',
}));

const region = createFactory<CatalogRegion>(() => ({
  identifier: '',
  displayName: '',
  status: 'available',
  datacenters: [],
  hasVolumes: false,
  category: 'koyeb',
}));

const instance = createFactory<CatalogInstance>(() => ({
  identifier: '',
  displayName: '',
  status: 'available',
  category: 'standard',
  cpu: 0,
  ram: '',
  disk: '',
  pricePerMonth: 0,
  pricePerSecond: 0,
  hasVolumes: false,
}));

const environmentVariable = createFactory<EnvironmentVariable>(() => ({
  name: '',
  value: '',
}));

const volume = createFactory<Volume>(() => ({
  id: createId(),
  status: 'attached',
  name: '',
  region: '',
  size: 0,
  createdAt: createDate(),
}));

const simpleSecret = createFactory<Secret>(() => ({
  id: createId(),
  name: '',
  type: 'simple',
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
  lastPush: '',
  branches: [],
}));

const app = createFactory<App>(() => ({
  id: createId(),
  name: '',
  status: 'healthy',
  domains: [],
}));

const appDomain = createFactory<AppDomain>(() => ({
  id: createId(),
  name: '',
  type: 'autoassigned',
}));

const service = createFactory<Service>(() => ({
  id: createId(),
  appId: '',
  latestDeploymentId: '',
  type: 'web',
  name: '',
  status: 'healthy',
  createdAt: createDate(),
}));

const computeDeployment = createFactory<ComputeDeployment>(() => ({
  id: createId(),
  appId: '',
  serviceId: '',
  name: '',
  date: createDate(),
  status: 'healthy',
  messages: [],
  definition: deploymentDefinition(),
  definitionApi: {},
  trigger: null,
}));

const deploymentDefinition = createFactory<DeploymentDefinition>(() => ({
  name: '',
  type: 'web',
  strategy: 'rolling',
  source: { type: 'git', repository: '', branch: '', autoDeploy: false },
  environmentVariables: [],
  volumes: [],
  instanceType: '',
  regions: [],
  ports: [],
  scaling: { type: 'fixed', instances: 0 },
}));

const deploymentInstance = createFactory<Instance>(() => ({
  id: createId(),
  status: 'healthy',
  name: '',
  region: '',
  type: '',
  replicaIndex: 0,
  createdAt: createDate(),
  messages: [],
}));

const databaseDeployment = createFactory<DatabaseDeployment>(() => ({
  id: createId(),
  appId: '',
  serviceId: '',
  name: '',
  status: 'healthy',
  postgresVersion: 16,
  region: '',
  instance: '',
  activeTime: {},
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
