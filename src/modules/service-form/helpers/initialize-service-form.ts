import { QueryClient } from '@tanstack/react-query';
import merge from 'lodash-es/merge';
import { DeepPartial } from 'react-hook-form';

import { api } from 'src/api/api';
import { mapRepository } from 'src/api/mappers/git';
import { CatalogDatacenter, CatalogInstance, CatalogRegion, GithubApp, Organization } from 'src/api/model';
import { getDefaultRegion } from 'src/application/default-region';
import { notify } from 'src/application/notify';
import { fetchGithubRepository } from 'src/components/public-github-repository-input/github-api';
import { hasProperty } from 'src/utils/object';

import { generateServiceName } from '../sections/00-service-name/use-generate-service-name';
import { HealthCheck, ServiceForm } from '../service-form.types';

import { deploymentDefinitionToServiceForm } from './deployment-to-service-form';
import { generateAppName } from './generate-app-name';
import { parseDeployParams } from './parse-deploy-params';

export async function initializeServiceForm(
  params: URLSearchParams,
  datacenters: CatalogDatacenter[],
  regions: CatalogRegion[],
  instances: CatalogInstance[],
  organization: Organization,
  githubApp: GithubApp | undefined,
  serviceId: string | undefined,
  queryClient: QueryClient,
): Promise<ServiceForm> {
  let values = defaultServiceForm();

  const getApp = async (appId: string) => {
    return api.getApp({ path: { id: appId } });
  };

  const getService = async (serviceId: string) => {
    return api.getService({ path: { id: serviceId } });
  };

  const getDeployment = async (deploymentId: string) => {
    return api.getDeployment({ path: { id: deploymentId } });
  };

  if (serviceId) {
    const { service } = await getService(serviceId);
    const { app } = await getApp(service!.app_id!);
    const { volumes } = await api.listVolumes({ query: { limit: '100' } });
    const deployment = await getDeployment(service!.latest_deployment_id!);
    const definition = deployment.deployment!.definition!;

    values.meta.serviceId = service!.id!;
    values.meta.appId = app!.id!;
    values.appName = app!.name!;

    values = merge(
      values,
      deploymentDefinitionToServiceForm(definition, githubApp?.organizationName, volumes!),
    );

    values.meta.previousInstance = values.instance;
    values.meta.hasPreviousBuild = service?.last_provisioned_deployment_id !== '';
  }

  const duplicateServiceId = params.get('duplicate-service-id');

  if (duplicateServiceId !== null) {
    const { service } = await getService(duplicateServiceId);
    const deployment = await getDeployment(service!.latest_deployment_id!);
    const definition = deployment.deployment!.definition!;

    definition.volumes = [];

    values = merge(values, deploymentDefinitionToServiceForm(definition, githubApp?.organizationName, []));
  }

  if (!serviceId) {
    const parsedParams = parseDeployParams(params, instances, regions, githubApp?.organizationName);

    values = merge(values, parsedParams);

    ensureServiceCreationBusinessRules(
      values,
      datacenters,
      regions,
      instances,
      organization,
      parsedParams,
      queryClient,
    );
  }

  if (values.source.type === 'git') {
    if (values.source.git.repositoryType === 'organization') {
      const { repositoryName } = values.source.git.organizationRepository;

      if (repositoryName) {
        const repository = await api
          .listRepositories({ query: { name: repositoryName, name_search_op: 'equality' } })
          .then(({ repositories }) => repositories!.map(mapRepository))
          .then(([repository]) => repository);

        if (repository) {
          values.source.git.organizationRepository.id = repository.id;
          values.source.git.organizationRepository.branch ??= repository.defaultBranch;

          queryClient.setQueryData(['listRepositories', repositoryName, 'equality'], [repository]);
          queryClient.setQueryData(['listRepositoryBranches', repository.id, ''], [repository.defaultBranch]);
        } else {
          values.source.git.organizationRepository.repositoryName = null;
          values.source.git.organizationRepository.branch = null;
        }
      }
    }

    if (values.source.git.repositoryType === 'public') {
      const { repositoryName } = values.source.git.publicRepository;

      const repository = repositoryName
        ? await fetchGithubRepository(repositoryName).catch(() => null)
        : null;

      if (repository) {
        values.source.git.publicRepository.url = repository.url;
        values.source.git.publicRepository.branch ??= repository.defaultBranch;

        queryClient.setQueryData(['getPublicRepository', repositoryName], repository);
      } else {
        values.source.git.publicRepository.url = '';
        values.source.git.publicRepository.repositoryName = null;
        values.source.git.publicRepository.branch = null;
      }
    }
  }

  if (params.get('source') === 'github') {
    values.meta.expandedSection = 'source';
    values.source.type = 'git';
    values.source.git.repositoryType = 'organization';
  }

  if (params.get('github_error')) {
    notify.error(params.get('github_error'));
  }

  if (!values.serviceName) {
    const serviceName = generateServiceName(values);

    if (serviceName) {
      values.serviceName = serviceName;
    }
  }

  return values;
}

export function defaultHealthCheck(): HealthCheck {
  return {
    protocol: 'tcp',
    gracePeriod: 5,
    interval: 30,
    restartLimit: 3,
    timeout: 5,
    method: 'get',
    path: '/',
    headers: [],
  };
}

export function defaultServiceForm(): ServiceForm {
  return {
    meta: {
      expandedSection: null,
      appId: null,
      serviceId: null,
      previousInstance: null,
      hasPreviousBuild: false,
      skipBuild: false,
      saveOnly: false,
      proxyFields: {},
    },
    appName: '',
    serviceName: '',
    serviceType: 'web',
    source: {
      type: 'git',
      archive: {
        archiveId: '',
      },
      git: {
        repositoryType: 'organization',
        organizationRepository: {
          id: null,
          repositoryName: null,
          branch: null,
          autoDeploy: true,
        },
        publicRepository: {
          repositoryName: null,
          branch: null,
          url: '',
        },
        workDirectory: null,
      },
      docker: {
        image: '',
        registrySecret: null,
      },
    },
    builder: {
      type: 'buildpack',
      buildpackOptions: {
        buildCommand: null,
        runCommand: null,
        privileged: false,
      },
      dockerfileOptions: {
        dockerfile: null,
        entrypoint: null,
        command: null,
        args: null,
        target: null,
        privileged: false,
      },
    },
    dockerDeployment: {
      entrypoint: null,
      command: null,
      args: null,
      privileged: false,
    },
    environmentVariables: [
      {
        name: '',
        value: '',
        regions: [],
      },
    ],
    files: [],
    scaling: {
      min: 1,
      max: 1,
      targets: {
        requests: { enabled: false, value: 50 },
        cpu: { enabled: false, value: 80 },
        memory: { enabled: false, value: 80 },
        concurrentRequests: { enabled: false, value: 20 },
        responseTime: { enabled: false, value: 300 },
        sleepIdleDelay: { lightSleepValue: NaN, deepSleepValue: 5 * 60 },
      },
    },
    instance: 'nano',
    regions: ['fra'],
    ports: [
      {
        portNumber: 8000,
        protocol: 'http',
        path: '/',
        public: true,
        tcpProxy: false,
        healthCheck: defaultHealthCheck(),
      },
    ],
    volumes: [],
  };
}

function ensureServiceCreationBusinessRules(
  values: ServiceForm,
  datacenters: CatalogDatacenter[],
  regions: CatalogRegion[],
  instances: CatalogInstance[],
  organization: Organization,
  parsedParams: DeepPartial<ServiceForm>,
  queryClient: QueryClient,
) {
  if (!values.appName) {
    values.appName = generateAppName();
  }

  if (organization.plan === 'hobby' && !parsedParams.instance) {
    values.instance = 'free';
  }

  const { serviceType } = values;
  const instance = instances.find(hasProperty('id', values.instance));

  if (instance?.id === 'free') {
    values.scaling.min = 0;
  }

  if (serviceType === 'web' && instance?.category === 'gpu' && parsedParams.scaling?.min === undefined) {
    values.scaling.min = 0;
  }

  if (values.scaling.max < values.scaling.min) {
    values.scaling.max = values.scaling.min;
  }

  if (values.scaling.min > 0 && values.scaling.min < values.scaling.max) {
    const target = serviceType === 'worker' ? 'cpu' : 'requests';
    values.scaling.targets[target].enabled = true;
  }

  // todo: remove
  // eslint-disable-next-line
  const registrySecret: string | undefined = (window as any).__KOYEB_REGISTRY_SECRET_HACK;

  if (registrySecret) {
    values.source.docker.registrySecret = registrySecret;
  }

  if (parsedParams.regions === undefined) {
    const defaultRegion = getDefaultRegion(queryClient, datacenters, regions, instance);

    if (defaultRegion !== undefined) {
      values.regions = [defaultRegion.id];
    }
  }
}
