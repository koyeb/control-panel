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
};

export type Invoice = {
  periods: InvoicePeriod[];
  discount?: InvoiceDiscount;
  totalWithoutDiscount?: number;
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

export type CatalogInstance = {
  identifier: string;
  displayName: string;
  status: CatalogInstanceStatus;
  plans?: string[];
  regions?: string[];
  category: InstanceCategory;
  cpu: number;
  ram: string;
  disk: string;
  hasVolumes: boolean;
  pricePerMonth: number;
  pricePerSecond: number;
};

export type CatalogInstanceStatus = 'available' | 'coming_soon';

export type InstanceCategory = 'eco' | 'standard' | 'gpu';

export type CatalogDatacenter = {
  identifier: string;
  regionIdentifier: string;
  domain: string;
};

export type CatalogRegion = {
  identifier: string;
  displayName: string;
  status: 'available' | 'coming_soon';
  datacenters: string[];
  instances?: string[];
  hasVolumes: boolean;
  category: RegionCategory;
};

export type RegionCategory = 'koyeb' | 'aws';

// deployment

export type Deployment = ComputeDeployment | DatabaseDeployment;

export type ComputeDeployment = {
  id: string;
  appId: string;
  serviceId: string;
  name: string;
  date: string;
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
  | 'stashed';

export type DeploymentBuild = {
  status: DeploymentBuildStatus;
  sha?: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type DeploymentBuildStatus = 'unknown' | 'pending' | 'running' | 'failed' | 'completed' | 'aborted';

export type DeploymentDefinition = {
  name: string;
  type: ComputeDeploymentType;
  strategy: DeploymentStrategy;
  source: ArchiveDeploymentSource | GitDeploymentSource | DockerDeploymentSource;
  builder?: BuildpackBuilder | DockerfileBuilder;
  privileged?: boolean;
  environmentVariables: EnvironmentVariable[];
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
  type?: EnvironmentVariableType;
  value: string;
};

export type EnvironmentVariableType = 'plaintext' | 'secret';

export type AttachedVolume = {
  volumeId: string;
  mountPath: string;
};

export type Port = {
  portNumber: number;
  protocol: PortProtocol;
  path?: string;
  public: boolean;
};

export type PortProtocol = 'http' | 'http2' | 'tcp';

export type HealthCheckProtocol = 'tcp' | 'http';

export type HealthCheckHeader = {
  name: string;
  value: string;
};

export type Scaling = FixedScaling | AutoScaling;

export type FixedScaling = {
  type: 'fixed';
  instances: number;
};

export type AutoScaling = {
  type: 'autoscaling';
  min: number;
  max: number;
};

export type ScalingType = Scaling['type'];

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
  date: string;
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

export type ExampleApp = {
  name: string;
  slug: string;
  description: string;
  logo: string;
  repository: string;
  deployUrl: string;
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
  maxInstancesByType: Record<string, number>;
  regions?: string[];
  volumesByRegion: Record<string, { maxVolumeSize: number; maxTotalSize: number }>;
  maxMemory: number;
  maxDomains: number;
};

export type OrganizationSummary = {
  freeInstanceUsed: boolean;
  freeDatabaseUsed: boolean;
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
  serviceId?: string;
  createdAt: string;
};

export type VolumeStatus = 'invalid' | 'attached' | 'detached' | 'deleting' | 'deleted';
