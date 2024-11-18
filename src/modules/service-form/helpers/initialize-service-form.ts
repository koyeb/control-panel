import { QueryClient } from '@tanstack/react-query';
import merge from 'lodash-es/merge';

import { api } from 'src/api/api';
import { mapRepositoriesList } from 'src/api/mappers/git';
import { CatalogInstance, CatalogRegion, GithubApp, Organization } from 'src/api/model';
import { notify } from 'src/application/notify';
import { getToken } from 'src/application/token';
import { fetchGithubRepository } from 'src/components/public-github-repository-input/github-api';
import { hasProperty } from 'src/utils/object';

import { generateServiceName } from '../sections/00-service-name/use-generate-service-name';
import { HealthCheck, ServiceForm } from '../service-form.types';

import { deploymentDefinitionToServiceForm } from './deployment-to-service-form';
import { generateAppName } from './generate-app-name';
import { parseDeployParams } from './parse-deploy-params';

export async function initializeServiceForm(
  params: URLSearchParams,
  regions: CatalogRegion[],
  instances: CatalogInstance[],
  organization: Organization,
  githubApp: GithubApp | undefined,
  appId: string | undefined,
  serviceId: string | undefined,
  queryClient: QueryClient,
): Promise<ServiceForm> {
  const token = getToken();
  let values = defaultServiceForm();

  if (serviceId) {
    const service = await api.getService({
      token,
      path: { id: serviceId },
    });

    appId = service.service!.app_id!;

    values.meta.appId = appId;
    values.meta.serviceId = serviceId;

    const deployment = await api.getDeployment({
      token,
      path: { id: service.service!.latest_deployment_id! },
    });

    const definition = deployment.deployment!.definition!;

    const { volumes } = await api.listVolumes({ token, query: {} });

    values = merge(
      values,
      deploymentDefinitionToServiceForm(definition, githubApp?.organizationName, volumes!),
    );

    if (values.environmentVariables.length === 0) {
      values.environmentVariables = defaultServiceForm().environmentVariables;
    }

    if (values.instance.identifier === 'free') {
      values.meta.allowFreeInstanceIfAlreadyUsed = true;
    }

    values.meta.hasPreviousBuild = service.service?.last_provisioned_deployment_id !== '';
  }

  if (!serviceId) {
    values = merge(values, parseDeployParams(params, instances, regions, githubApp?.organizationName));

    if (!values.appName) {
      values.appName = generateAppName();
    }

    if (organization.plan === 'hobby' && !params.has('instance_type')) {
      values.instance.category = 'eco';
      values.instance.identifier = 'free';
    }

    // todo: remove
    // eslint-disable-next-line
    const registrySecret: string | undefined = (window as any).__KOYEB_REGISTRY_SECRET_HACK;

    if (registrySecret) {
      values.source.docker.registrySecret = registrySecret;
    }
  }

  if (appId) {
    const app = await api.getApp({
      token,
      path: { id: appId },
    });

    values.meta.appId = appId;
    values.appName = app.app!.name!;
  }

  if (values.source.type === 'git') {
    if (values.source.git.repositoryType === 'organization') {
      const { repositoryName } = values.source.git.organizationRepository;

      if (repositoryName) {
        const repository = await api
          .listRepositories({ token, query: { name: repositoryName, name_search_op: 'equality' } })
          .then(mapRepositoriesList)
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

  const instance = instances.find(hasProperty('identifier', values.instance.identifier));

  if (instance) {
    values.instance.category = instance.category;
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
      allowFreeInstanceIfAlreadyUsed: false,
      hasPreviousBuild: false,
      skipBuild: false,
      saveOnly: false,
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
      },
    ],
    scaling: {
      type: 'fixed',
      fixed: 1,
      autoscaling: {
        min: 1,
        max: 3,
        targets: {
          requests: { enabled: true, value: 50 },
          cpu: { enabled: false, value: 80 },
          memory: { enabled: false, value: 80 },
          concurrentRequests: { enabled: false, value: 20 },
          responseTime: { enabled: false, value: 300 },
          sleepIdleDelay: { enabled: false, value: 60 },
        },
      },
    },
    instance: {
      category: 'standard',
      identifier: 'nano',
    },
    regions: ['fra'],
    ports: [
      {
        portNumber: 8000,
        protocol: 'http',
        path: '/',
        public: true,
        healthCheck: defaultHealthCheck(),
      },
    ],
    volumes: [],
  };
}
