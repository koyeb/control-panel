import clone from 'lodash-es/cloneDeep';

import { createDate } from 'src/utils/date';
import { createId } from 'src/utils/strings';

import { Api } from '../api-types';

import {
  createApiApp,
  createApiDeployment,
  createApiDeploymentDefinition,
  createApiInstance,
  createApiRepository,
  createApiSecret,
  createApiService,
  createApiVolume,
} from './api-factories';
import { catalogDatacenterFixtures, catalogInstanceFixtures, catalogRegionFixtures } from './fixtures';
import { MockApiStream } from './mock-api';

export class ApiData {
  constructor() {}

  public catalogRegions = clone(catalogRegionFixtures);
  public catalogInstances = clone(catalogInstanceFixtures);
  public catalogDatacenters = clone(catalogDatacenterFixtures);

  public user: Api.User = {
    id: createId(),
    name: 'me',
    email: 'me@koyeb.com',
    avatar_url: 'https://gravatar.com/avatar',
  };

  public intercomUserHash: Api.IntercomUserHash = {
    hash: '',
  };

  public organization: Api.Organization = {
    id: 'organizationId',
    name: 'my-organization',
    status: 'ACTIVE',
    status_message: 'VALID',
    plan: 'starter',
  };

  public organizationSummary: Api.OrganizationSummary = {
    instances: {
      by_type: { free: '0' },
    },
    neon_postgres: {
      by_instance_type: { free: '0' },
    },
  };

  public organizationQuotas: Api.Quotas = {
    regions: ['fra'],
    max_instances_by_type: { free: '1' },
    persistent_volumes_by_region: {
      fra: { max_volume_size: 10, max_per_instance_size: 10, max_total_size: 100 },
    },
  };

  public githubApp: Api.GithubInstallation = {
    name: 'github-org',
  };

  public repositories: Api.Repository[] = [
    createApiRepository({
      id: 'repository1Id',
      name: 'org/repo-1',
      is_private: false,
      default_branch: 'master',
      last_push_date: createDate('2024-01-01'),
    }),
    createApiRepository({
      id: 'repository2Id',
      name: 'org/repo-2',
      is_private: true,
      default_branch: 'main',
      last_push_date: createDate('2024-02-01'),
    }),
  ];

  public branches: Api.RepositoryBranch[] = [
    { repository_id: 'repository1Id', name: 'master' },
    { repository_id: 'repository2Id', name: 'main' },
    { repository_id: 'repository2Id', name: 'develop' },
    { repository_id: 'repository2Id', name: 'feature-01' },
  ];

  public secrets: Api.Secret[] = [
    createApiSecret({ name: 'my-secret-1', type: 'SIMPLE' }),
    createApiSecret({ name: 'my-secret-2', type: 'SIMPLE' }),
    createApiSecret({ name: 'my-registry-secret-1', type: 'REGISTRY' }),
    createApiSecret({ name: 'my-registry-secret-2', type: 'REGISTRY' }),
  ];

  public verifyDockerImage: Api.VerifyDockerImageReply = {
    success: true,
  };

  public volumes: Api.PersistentVolume[] = [
    createApiVolume({
      created_at: createDate('2024-01-01'),
    }),
  ];

  public serviceVariables: Api.ServiceVariables = {
    secrets: this.secrets.map((secret) => secret.name!),
    system_env: [
      'KOYEB_REGION',
      'KOYEB_SERVICE_PRIVATE_DOMAIN',
      'KOYEB_REGIONAL_DEPLOYMENT_ID',
      'KOYEB_SERVICE_NAME',
      'KOYEB_PRIVILEGED',
      'KOYEB_INSTANCE_ID',
      'KOYEB_APP_NAME',
      'KOYEB_ORGANIZATION_NAME',
      'KOYEB_INSTANCE_MEMORY_MB',
      'KOYEB_REPLICA_INDEX',
      'KOYEB_DC',
      'KOYEB_ORGANIZATION_ID',
      'KOYEB_SERVICE_ID',
      'KOYEB_INSTANCE_TYPE',
      'KOYEB_GIT_BRANCH',
      'KOYEB_HYPERVISOR_ID',
      'PORT',
      'KOYEB_APP_ID',
      'KOYEB_GIT_REPOSITORY',
      'KOYEB_PUBLIC_DOMAIN',
      'KOYEB_PORT_8000_PROTOCOL',
    ],
    user_env: [],
  };

  public apps = [
    createApiApp({
      id: 'appId',
      name: 'my-app',
    }),
  ];

  public services = [
    createApiService({
      id: 'serviceId',
      app_id: 'appId',
      name: 'my-service',
      active_deployment_id: 'deploymentId',
      latest_deployment_id: 'deploymentId',
    }),
  ];

  public deployments: Api.Deployment[] = [
    createApiDeployment({
      id: 'deploymentId',
      app_id: 'appId',
      service_id: 'serviceId',
      provisioning_info: {
        stages: [
          {
            name: 'build',
            status: 'COMPLETED',
            started_at: createDate('2024-01-01T00:00:00'),
            finished_at: createDate('2024-01-01T00:01:54'),
          },
        ],
      },
      status: 'HEALTHY',
      definition: createApiDeploymentDefinition({
        type: 'WEB',
        git: {
          repository: 'github.com/org/repo',
          branch: 'master',
          sha: 'cafe4242',
          buildpack: {
            privileged: false,
          },
        },
        env: [{}, {}],
        instance_types: [{ type: 'free' }],
        scalings: [{ min: 2, max: 3 }],
        regions: ['fra', 'par'],
        ports: [
          { port: 4242, protocol: 'http' },
          { port: 5151, protocol: 'http' },
          { port: 6969, protocol: 'tcp' },
        ],
        routes: [
          { port: 4242, path: '/path' },
          { port: 5151, path: '/' },
        ],
      }),
    }),
  ];

  public instances: Api.Instance[] = [
    createApiInstance({
      app_id: 'appId',
      service_id: 'serviceId',
    }),
  ];

  stream = new (class extends MockApiStream {
    override addEventListener(type: string, callback: EventListenerOrEventListenerObject): void {
      super.addEventListener(type, callback);

      if (type === 'open') {
        this.dispatchEvent(new Event('open'));
      }
    }
  })();
}
