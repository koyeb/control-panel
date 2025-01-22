import { components } from './api.generated';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Api {
  type schemas = components['schemas'];

  export type Activity = schemas['Activity'];
  export type App = schemas['App'];
  export type ArchiveSource = schemas['ArchiveSource'];
  export type BuildpackBuilder = schemas['BuildpackBuilder'];
  export type CatalogDatacenters = schemas['DatacenterListItem'];
  export type CatalogInstance = schemas['CatalogInstance'];
  export type CatalogRegion = schemas['Region'];
  export type Deployment = schemas['Deployment'];
  export type DeploymentDefinition = schemas['DeploymentDefinition'];
  export type DeploymentEnv = schemas['DeploymentEnv'];
  export type DeploymentConfigFile = schemas['ConfigFile'];
  export type DeploymentHealthCheck = schemas['DeploymentHealthCheck'];
  export type DeploymentNeonPostgresDatabaseInfo = schemas['DeploymentNeonPostgresDatabaseInfo'];
  export type DeploymentScaling = schemas['DeploymentScaling'];
  export type DeploymentScalingTarget = schemas['DeploymentScalingTarget'];
  export type DeploymentStage = schemas['DeploymentProvisioningInfo.Stage'];
  export type DeploymentStatus = schemas['Deployment.Status'];
  export type DockerBuilder = schemas['DockerBuilder'];
  export type DockerSource = schemas['DockerSource'];
  export type Domain = schemas['Domain'];
  export type GithubInstallation = schemas['GetGithubInstallationReply'];
  export type GitSource = schemas['GitSource'];
  export type HttpHealthCheck = schemas['HTTPHealthCheck'];
  export type Instance = schemas['Instance'];
  export type IntercomUserHash = schemas['GetIntercomProfileReply'];
  export type Metric = schemas['GetMetricsReply.Metric'];
  export type MetricName = schemas['MetricName'];
  export type NeonPostgresDatabase = schemas['NeonPostgresDatabase'];
  export type NextInvoice = schemas['NextInvoiceReply'];
  export type NextInvoiceDiscount = schemas['NextInvoiceReply.Discount'];
  export type NextInvoiceLine = schemas['NextInvoiceReply.Line'];
  export type Organization = schemas['Organization'];
  export type OrganizationInvitation = schemas['OrganizationInvitation'];
  export type OrganizationMember = schemas['OrganizationMember'];
  export type OrganizationSummary = schemas['OrganizationSummary'];
  export type PersistentVolume = schemas['PersistentVolume'];
  export type Port = schemas['Port'];
  export type Quotas = schemas['Quotas'];
  export type Repository = schemas['kgitproxy.Repository'];
  export type RepositoryBranch = schemas['kgitproxy.Branch'];
  export type Route = schemas['Route'];
  export type Secret = schemas['Secret'];
  export type Service = schemas['Service'];
  export type ServiceVariables = schemas['AutocompleteReply'];
  export type Snapshot = schemas['Snapshot'];
  export type Subscription = schemas['Subscription'];
  export type TcpHealthCheck = schemas['TCPHealthCheck'];
  export type Token = schemas['Token'];
  export type User = schemas['User'];
  export type VerifyDockerImageReply = schemas['VerifyDockerImageReply'];
}
