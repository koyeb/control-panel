import { components } from './api.generated';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Api {
  type schemas = components['schemas'];

  export type Activity = schemas['Activity'];
  export type App = schemas['App'];
  export type ArchiveSource = schemas['ArchiveSource'];
  export type BuildpackBuilder = schemas['BuildpackBuilder'];
  export type DatacenterListItem = schemas['DatacenterListItem'];
  export type CatalogInstance = schemas['CatalogInstance'];
  export type Region = schemas['Region'];
  export type CatalogUsage = schemas['CatalogUsage'];
  export type Deployment = schemas['Deployment'];
  export type DeploymentConfigFile = schemas['ConfigFile'];
  export type DeploymentDefinition = schemas['DeploymentDefinition'];
  export type DeploymentEnv = schemas['DeploymentEnv'];
  export type DeploymentHealthCheck = schemas['DeploymentHealthCheck'];
  export type DeploymentNeonPostgresDatabaseInfo = schemas['DeploymentNeonPostgresDatabaseInfo'];
  export type GetDeploymentScalingReplyItem = schemas['GetDeploymentScalingReplyItem'];
  export type DeploymentScaling = schemas['DeploymentScaling'];
  export type DeploymentScalingTarget = schemas['DeploymentScalingTarget'];
  export type DeploymentProvisioningInfoStage = schemas['DeploymentProvisioningInfo.Stage'];
  export type DeploymentStatus = schemas['Deployment.Status'];
  export type DockerBuilder = schemas['DockerBuilder'];
  export type DockerSource = schemas['DockerSource'];
  export type Domain = schemas['Domain'];
  export type GetGithubInstallationReply = schemas['GetGithubInstallationReply'];
  export type GitSource = schemas['GitSource'];
  export type HTTPHealthCheck = schemas['HTTPHealthCheck'];
  export type Instance = schemas['Instance'];
  export type GetIntercomProfileReply = schemas['GetIntercomProfileReply'];
  export type GetMetricsReplyMetric = schemas['GetMetricsReply.Metric'];
  export type MetricName = schemas['MetricName'];
  export type NeonPostgresDatabase = schemas['NeonPostgresDatabase'];
  export type NextInvoiceReply = schemas['NextInvoiceReply'];
  export type NextInvoiceReplyDiscount = schemas['NextInvoiceReply.Discount'];
  export type NextInvoiceReplyLine = schemas['NextInvoiceReply.Line'];
  export type Organization = schemas['Organization'];
  export type OrganizationInvitation = schemas['OrganizationInvitation'];
  export type OrganizationMember = schemas['OrganizationMember'];
  export type OrganizationSummary = schemas['OrganizationSummary'];
  export type PersistentVolume = schemas['PersistentVolume'];
  export type Port = schemas['Port'];
  export type Plan = schemas['Plan'];
  export type Quotas = schemas['Quotas'];
  export type RegionalDeployment = schemas['RegionalDeployment'];
  export type Repository = schemas['kgitproxy.Repository'];
  export type RepositoryBranch = schemas['kgitproxy.Branch'];
  export type Route = schemas['Route'];
  export type Secret = schemas['Secret'];
  export type Service = schemas['Service'];
  export type AutocompleteReply = schemas['AutocompleteReply'];
  export type Snapshot = schemas['Snapshot'];
  export type Subscription = schemas['Subscription'];
  export type TCPHealthCheck = schemas['TCPHealthCheck'];
  export type Token = schemas['Token'];
  export type User = schemas['User'];
  export type VerifyDockerImageReply = schemas['VerifyDockerImageReply'];
}
