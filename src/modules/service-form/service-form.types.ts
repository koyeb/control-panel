import { ServiceType } from 'src/api/model';

export type ServiceFormSection =
  | 'serviceType'
  | 'source'
  | 'builder'
  | 'deployment'
  | 'environmentVariables'
  | 'regions'
  | 'instance'
  | 'scaling'
  | 'ports'
  | 'healthChecks'
  | 'volumes'
  | 'serviceName';

export type ServiceForm = {
  meta: ServiceFormMeta;
  appName: string;
  serviceName: string;
  serviceType: ServiceType;
  source: Source;
  builder: Builder;
  dockerDeployment: DockerDeploymentOptions;
  environmentVariables: EnvironmentVariable[];
  fileMounts: FileMount[];
  regions: string[];
  instance: string | null;
  scaling: Scaling;
  ports: Port[];
  volumes: ServiceVolume[];
};

type ServiceFormMeta = {
  expandedSection: ServiceFormSection | null;
  appId: string | null;
  serviceId: string | null;
  previousInstance: string | null;
  hasPreviousBuild: boolean;
  skipBuild: boolean;
  saveOnly: boolean;
};

type Source = {
  type: SourceType;
  archive: ArchiveSource;
  git: GitSource;
  docker: DockerSource;
};

export type SourceType = 'archive' | 'git' | 'docker';

export type ArchiveSource = {
  archiveId: string;
};

export type GitSource = {
  repositoryType: RepositoryType;
  organizationRepository: OrganizationRepositorySource;
  publicRepository: PublicRepositorySource;
  workDirectory: string | null;
};

export type RepositoryType = 'organization' | 'public';

export type OrganizationRepositorySource = {
  id: string | null;
  repositoryName: string | null;
  branch: string | null;
  autoDeploy: boolean;
};

export type PublicRepositorySource = {
  url: string;
  repositoryName: string | null;
  branch: string | null;
};

export type DockerSource = {
  image: string;
  registrySecret: string | null;
};

export type Builder = {
  type: BuilderType;
  buildpackOptions: {
    buildCommand: string | null;
    runCommand: string | null;
    privileged: boolean;
  };
  dockerfileOptions: {
    dockerfile: string | null;
    entrypoint: string[] | null;
    command: string | null;
    args: string[] | null;
    target: string | null;
    privileged: boolean;
  };
};

export type BuilderType = 'buildpack' | 'dockerfile';

export type DockerDeploymentOptions = {
  entrypoint: string[] | null;
  command: string | null;
  args: string[] | null;
  privileged: boolean;
};

export type EnvironmentVariable = {
  name: string;
  value: string;
  regions: string[];
};

export type FileMount = {
  mountPath: string;
  permissions: string;
  content: string;
};

export type Scaling = {
  min: number;
  max: number;
  targets: Record<
    'cpu' | 'memory' | 'requests' | 'concurrentRequests' | 'responseTime' | 'sleepIdleDelay',
    ScalingTarget
  >;
};

export type ScalingTarget = {
  enabled: boolean;
  value: number;
};

export type Port = {
  portNumber: number;
  protocol: PortProtocol;
  path: string;
  public: boolean;
  healthCheck: HealthCheck;
};

export type PortProtocol = 'http' | 'http2' | 'tcp';

export type HealthCheck = {
  protocol: HealthCheckProtocol;
  gracePeriod: number;
  interval: number;
  restartLimit: number;
  timeout: number;
  path: string;
  method: string;
  headers: Array<HealthCheckHeader>;
};

export type HealthCheckProtocol = 'tcp' | 'http';

export type HealthCheckHeader = {
  name: string;
  value: string;
};

export type ServiceVolume = {
  volumeId?: string;
  name: string;
  size: number;
  mountPath: string;
  mounted: boolean;
};
