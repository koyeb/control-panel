// activity

export type Activity = {
  id: string;
  date: string;
  verb: string;
  tokenId?: string;
  actor: ActivityActor;
  object: ActivityObject;
  metadata: unknown;
};

export type ActivityActor = {
  name: string;
  type: string;
  metadata: unknown;
};

export type ActivityObject = {
  id: string;
  name: string;
  type: string;
  deleted: boolean;
  metadata: Record<string, unknown>;
};

// api credential

export type ApiCredential = {
  id: string;
  type: ApiCredentialType;
  name: string;
  description?: string;
  token?: string;
  createdAt: string;
};

export type ApiCredentialType = 'user' | 'organization';

// billing

export type Subscription = {
  id: string;
  hasPaymentFailure: boolean;
  hasPendingUpdate: boolean;
  trial?: {
    currentSpend: number;
    maxSpend: number;
  };
};

export type Invoice = {
  periods: InvoicePeriod[];
  discounts: InvoiceDiscount[];
  totalWithoutDiscount: number;
  total: number;
};

export type InvoicePeriod = {
  start: string;
  end: string;
  lines: InvoiceLine[];
};

export type InvoiceUsageLine = {
  type: 'usage';
  label: string;
  price: number;
  usage: number;
  total: number;
};

export type InvoicePlanLine = {
  type: 'plan';
  label: string;
  total: number;
};

export type InvoiceLine = InvoiceUsageLine | InvoicePlanLine;

export type InvoiceDiscount = {
  type: InvoiceDiscountType;
  label: string;
  value: number;
};

export type InvoiceDiscountType = 'unknown' | 'amountOff' | 'percentOff';

// catalog

export type CatalogInstanceStatus = 'available' | 'coming_soon' | 'restricted';
export type InstanceCategory = 'eco' | 'standard' | 'gpu';

export type CatalogInstance = {
  id: string;
  displayName: string;
  status: CatalogInstanceStatus;
  plans?: string[];
  regions?: string[];
  regionCategory: RegionCategory;
  category: InstanceCategory;
  cpu: number;
  ram: string;
  vram?: number;
  disk: string;
  hasVolumes: boolean;
  pricePerMonth: number;
  pricePerHour: number;
  pricePerSecond: number;
};

export type CatalogDatacenter = {
  id: string;
  regionId: string;
  domain: string;
};

export type RegionStatus = 'available' | 'coming_soon';
export type RegionCategory = 'koyeb' | 'aws';
export type RegionScope = 'continental' | 'metropolitan';

export type CatalogRegion = {
  id: string;
  displayName: string;
  status: RegionStatus;
  datacenters: string[];
  instances?: string[];
  hasVolumes: boolean;
  category: RegionCategory;
  scope: RegionScope;
};

export type OneClickApp = {
  name: string;
  slug: string;
  description: string;
  logo: string;
  deployUrl: string;
};

export type AiModel = {
  name: string;
  slug: string;
  description: string;
  logo: string;
  dockerImage: string;
  minVRam: number;
  metadata: Array<{ name: string; value: string }>;
  env?: Array<EnvironmentVariable>;
};

// deployment

export type Deployment = ComputeDeployment | DatabaseDeployment;

export type ComputeDeployment = {
  id: string;
  appId: string;
  serviceId: string;
  name: string;
  date: string;
  terminatedAt?: string;
  status: DeploymentStatus;
  messages: string[];
  definition: DeploymentDefinition;
  definitionApi: object;
  build?: DeploymentBuild;
  buildSkipped?: boolean;
  trigger:
    | InitialDeploymentTrigger
    | RedeployDeploymentTrigger
    | ResumeDeploymentTrigger
    | GitDeploymentTrigger
    | null;
};

export type DeploymentStatus =
  | 'pending'
  | 'provisioning'
  | 'scheduled'
  | 'canceling'
  | 'canceled'
  | 'allocating'
  | 'starting'
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'stopping'
  | 'stopped'
  | 'erroring'
  | 'error'
  | 'stashed'
  | 'sleeping';

export type DeploymentBuild = {
  status: DeploymentBuildStatus;
  sha?: string;
  steps?: DeploymentBuildStep[];
  startedAt: string | null;
  finishedAt: string | null;
};

export type DeploymentBuildStatus = 'unknown' | 'pending' | 'running' | 'failed' | 'completed' | 'aborted';

export type DeploymentBuildStep = {
  name: DeploymentBuildStepName;
  status: DeploymentBuildStatus;
  messages: string[];
  startedAt: string | null;
  finishedAt: string | null;
};

export type DeploymentBuildStepName = 'git-clone' | 'analyze' | 'detect' | 'restore' | 'build' | 'export';

export type DeploymentDefinition = {
  name: string;
  type: ComputeDeploymentType;
  strategy: DeploymentStrategy;
  source: ArchiveDeploymentSource | GitDeploymentSource | DockerDeploymentSource;
  builder?: BuildpackBuilder | DockerfileBuilder;
  privileged?: boolean;
  environmentVariables: EnvironmentVariable[];
  files: File[];
  volumes: AttachedVolume[];
  instanceType: string;
  regions: string[];
  ports: Port[];
  scaling: Scaling;
};

export type ComputeDeploymentType = 'web' | 'worker';

export type DeploymentStrategy = 'invalid' | 'canary' | 'rolling' | 'blue_green' | 'immediate';

export type EnvironmentVariable = {
  name: string;
  value: string;
  regions: string[];
};

export type File = {
  mountPath: string;
  content: string;
};

export type AttachedVolume = {
  volumeId: string;
  mountPath: string;
};

export type Port = {
  portNumber: number;
  protocol: PortProtocol;
  path?: string;
};

export type PortProtocol = 'http' | 'http2' | 'tcp';

export type HealthCheckProtocol = 'tcp' | 'http';

export type HealthCheckHeader = {
  name: string;
  value: string;
};

export type Scaling = {
  min: number;
  max: number;
};

export type ArchiveDeploymentSource = {
  type: 'archive';
  archiveId: string;
};

export type GitDeploymentSource = {
  type: 'git';
  repository: string;
  branch: string;
  autoDeploy: boolean;
};

export type DockerDeploymentSource = {
  type: 'docker';
  image: string;
  entrypoint?: string[];
  command?: string;
  arguments?: string[];
};

export type BuildpackBuilder = {
  type: 'buildpack';
  buildCommand?: string;
  runCommand?: string;
};

export type DockerfileBuilder = {
  type: 'dockerfile';
  dockerfile?: string;
  entrypoint?: string[];
  command?: string;
  arguments?: string[];
  target?: string;
};

export type InitialDeploymentTrigger = {
  type: 'initial';
};

export type RedeployDeploymentTrigger = {
  type: 'redeploy';
};

export type ResumeDeploymentTrigger = {
  type: 'resume';
};

export type GitDeploymentTrigger = {
  type: 'git';
  repository: string;
  branch: string;
  commit: {
    sha: string;
    message: string;
    author: {
      name: string;
      avatar: string;
      url: string;
    };
  };
};

export type DatabaseDeployment = {
  id: string;
  appId: string;
  serviceId: string;
  name: string;
  status: DeploymentStatus;
  postgresVersion: PostgresVersion;
  region: string;
  host?: string;
  roles?: Array<DatabaseRole>;
  databases?: Array<LogicalDatabase>;
  instance: string;
  reachedQuota?: 'data-transfer' | 'written-data' | 'active-time' | 'storage-size';
  activeTime: {
    used?: number;
    max?: number;
  };
  disk: {
    used?: number;
    max?: number;
  };
};

export type PostgresVersion = 14 | 15 | 16;

export type DatabaseRole = {
  name: string;
  secretId: string;
};

export type LogicalDatabase = {
  name: string;
  owner: string;
};

// domains

export type Domain = {
  id: string;
  appId: string | null;
  name: string;
  intendedCname: string;
  type: 'autoassigned' | 'custom';
  status: DomainStatus;
  messages: string[];
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DomainStatus = 'pending' | 'active' | 'error' | 'deleting' | 'deleted';

// git

export type GithubApp = {
  installationId: string;
  installationUrl: string;
  organizationName: string;
  indexing: boolean;
  indexingPercent: number | null;
};

export type GitRepository = {
  id: string;
  name: string;
  url: string;
  isPrivate: boolean;
  defaultBranch: string;
  lastPush: string;
  branches: string[];
};

// instance

export type Instance = {
  id: string;
  name: string;
  status: InstanceStatus;
  type: string;
  region: string;
  replicaIndex: number;
  messages: string[];
  createdAt: string;
};

export type InstanceStatus =
  | 'allocating'
  | 'starting'
  | 'healthy'
  | 'unhealthy'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'sleeping';

// logs

export type LogLine = {
  id: string;
  date: Date;
  stream: 'stdout' | 'stderr' | 'koyeb';
  instanceId?: string;
  text: string;
  html: string;
};

// secret

export type Secret = {
  id: string;
  type: SecretType;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type RegistrySecret = Secret & {
  type: 'registry';
  registry: RegistryType;
};

export type SecretType = 'simple' | 'registry' | 'managed';

export type RegistryType = 'docker-hub' | 'digital-ocean' | 'github' | 'gitlab' | 'azure' | 'gcp' | 'private';

// service

export type App = {
  id: string;
  name: string;
  status: AppStatus;
  domains: AppDomain[];
};

export type AppStatus =
  | 'starting'
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'deleting'
  | 'deleted'
  | 'pausing'
  | 'paused'
  | 'resuming';

export type AppDomain = {
  id: string;
  name: string;
  type: 'autoassigned' | 'custom';
};

export type Service = {
  id: string;
  appId: string;
  latestDeploymentId: string;
  activeDeploymentId?: string;
  lastProvisionedDeploymentId?: string;
  type: ServiceType;
  name: string;
  status: ServiceStatus;
  upcomingDeploymentIds?: string[];
  createdAt: string;
};

export type ServiceType = 'web' | 'worker' | 'database';

export type ServiceStatus =
  | 'starting'
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'deleting'
  | 'deleted'
  | 'pausing'
  | 'paused'
  | 'resuming';

// session

export type OnboardingStep =
  | 'emailValidation'
  | 'joinOrganization'
  | 'qualification'
  | 'ai'
  | 'paymentMethod'
  | 'automaticReview';

export type User = {
  id: string;
  name: string;
  email: string;
  emailValidated: boolean;
  avatarUrl: string;
  githubUser?: string;
  flags: string[];
};

export type Organization = {
  id: string;
  name: string;
  status: OrganizationStatus;
  statusMessage: OrganizationStatusMessage;
  plan: OrganizationPlan;
  hasSignupQualification: boolean;
  signupQualification?: Record<string, unknown>;
  currentSubscriptionId?: string;
  latestSubscriptionId?: string;
  hasPaymentMethod: boolean;
  billing: {
    name?: string;
    email?: string;
    address?: Address;
    company?: boolean;
    vatNumber?: string;
  };
  trial?: {
    endsAt: string;
  };
};

export type OrganizationStatus =
  | 'warning'
  | 'locked'
  | 'active'
  | 'deactivating'
  | 'deactivated'
  | 'deleting'
  | 'deleted';

export type OrganizationStatusMessage =
  | 'new'
  | 'email_not_validated'
  | 'billing_info_missing'
  | 'locked'
  | 'payment_failure'
  | 'valid'
  | 'pending_verification'
  | 'verification_failed'
  | 'reviewing_account'
  | 'plan_upgrade_required';

export type OrganizationPlan =
  | 'hobby'
  | 'starter'
  | 'startup'
  | 'pro'
  | 'scale'
  | 'business'
  | 'enterprise'
  | 'internal'
  | 'no_plan';

export type OrganizationInvitation = {
  id: string;
  status: InvitationStatus;
  organization: {
    id: string;
    name: string;
  };
  invitee: {
    email: string;
  };
  inviter: {
    name: string;
    email: string;
    avatarUrl: string;
  };
};

export type InvitationStatus = 'invalid' | 'pending' | 'accepted' | 'refused' | 'expired';

export type OrganizationMember = {
  id: string;
  member: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
  organization: {
    id: string;
    name: string;
    status: OrganizationStatus;
  };
  joinedAt: string;
};

export type OrganizationQuotas = {
  maxNumberOfApps: number;
  maxNumberOfServices: number;
  maxOrganizationMembers: number;
  instanceTypes?: string[];
  maxInstancesByType: Record<string, number>;
  regions?: string[];
  volumesByRegion: Record<string, { maxVolumeSize: number; maxTotalSize: number }>;
  maxMemory: number;
  maxDomains: number;
  logsRetention: number;
};

export type OrganizationSummary = {
  freeInstanceUsed: boolean;
  freeDatabaseUsed: boolean;
  instancesUsed: Record<string, number>;
};

export type Address = {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: string;
};

// volumes

export type Volume = {
  id: string;
  status: VolumeStatus;
  name: string;
  region: string;
  size: number;
  snapshotId?: string;
  serviceId?: string;
  createdAt: string;
};

export type VolumeStatus = 'invalid' | 'attached' | 'detached' | 'deleting' | 'deleted';

export type VolumeSnapshot = {
  id: string;
  volumeId: string;
  name: string;
  size: number;
  region: string;
  status: VolumeSnapshotStatus;
  type: VolumeSnapshotType;
  createdAt: string;
};

export type VolumeSnapshotStatus =
  | 'invalid'
  | 'creating'
  | 'available'
  | 'migrating'
  | 'deleting'
  | 'deleted';

export type VolumeSnapshotType = 'invalid' | 'local' | 'remote';
