import { hasProperty, keys } from 'src/utils/object';

import { ApiEndpointParams, ApiEndpointResult, ApiStream, api, apiStreams } from '../api';
import { ApiError } from '../api-errors';

import { ApiData } from './api-data';
import { createApiApp, createApiDeployment, createApiInstance, createApiService } from './api-factories';

type MockEndpointFunction<Endpoint extends keyof typeof api> = (
  options: ApiEndpointParams<Endpoint>,
) => ApiEndpointResult<Endpoint> | Promise<ApiEndpointResult<Endpoint>>;

export class MockApiStream extends EventTarget implements ApiStream {
  readyState: number = WebSocket.OPEN;
  close(): void {}
  send(): void {}
}

class EntityNotFoundError extends ApiError {
  constructor(
    public readonly key: string,
    public readonly id: string,
  ) {
    super({
      status: 404,
      code: 'not_found',
      message: `Not found (key=${key}, id=${id})`,
    });
  }
}

export class ApiMock {
  public data = new ApiData();

  constructor() {
    this.initialize();
  }

  mockEndpoint<Endpoint extends keyof typeof api>(
    endpoint: Endpoint,
    result: ApiEndpointResult<Endpoint> | MockEndpointFunction<Endpoint>,
  ) {
    const mock = (options: ApiEndpointParams<Endpoint>) => {
      return Promise.resolve(typeof result === 'function' ? result(options) : result);
    };

    Object.defineProperty(api, endpoint, { value: mock });
  }

  mockStream<Stream extends 'logs' | 'exec'>(stream: Stream, value: (typeof apiStreams)[Stream]) {
    Object.defineProperty(api, stream, { value, configurable: true });
  }

  schedule() {
    const timeouts: number[] = [];
    let time = 0;

    return {
      wait(ms: number) {
        time += ms;
        return this;
      },
      run(fn: () => void) {
        timeouts.push(window.setTimeout(fn, time));
        return this;
      },
      clear() {
        timeouts.forEach((timeout) => window.clearTimeout(timeout));
      },
    };
  }

  private initialize() {
    const find = (key: keyof ApiData, id: string) => {
      const items = this.data[key] as Array<{ id: string }>;
      const item = items.find(hasProperty('id', id));

      if (item !== undefined) {
        return item;
      }

      throw new EntityNotFoundError(key, id);
    };

    for (const endpoint of keys(api)) {
      this.mockEndpoint(endpoint, () => {
        throw new Error(`Missing mock for ${endpoint}`);
      });
    }

    // account
    this.mockEndpoint('getCurrentUser', { user: this.data.user });
    this.mockEndpoint('getIntercomUserHash', this.data.intercomUserHash);

    // organization
    this.mockEndpoint('getCurrentOrganization', { organization: this.data.organization });
    this.mockEndpoint('organizationSummary', { summary: this.data.organizationSummary });
    this.mockEndpoint('organizationQuotas', { quotas: this.data.organizationQuotas });

    // catalog
    this.mockEndpoint('listCatalogRegions', { regions: this.data.catalogRegions });
    this.mockEndpoint('listCatalogDatacenters', { datacenters: this.data.catalogDatacenters });
    this.mockEndpoint('listCatalogInstances', { instances: this.data.catalogInstances });

    // docker image verification
    this.mockEndpoint('verifyDockerImage', this.data.verifyDockerImage);

    // volumes
    this.mockEndpoint('listVolumes', { volumes: this.data.volumes });

    // secrets
    this.mockEndpoint('listSecrets', this.listSecrets);

    // github app
    this.mockEndpoint('getGithubApp', this.data.githubApp);
    this.mockEndpoint('listRepositories', { repositories: this.data.repositories });
    this.mockEndpoint('listRepositoryBranches', this.listRepositoryBranches);

    // apps
    this.mockEndpoint('listApps', { apps: this.data.apps });
    this.mockEndpoint('getApp', ({ path }) => ({ app: find('apps', path.id) }));
    this.mockEndpoint('createApp', this.createApp);

    // services
    this.mockEndpoint('getService', ({ path }) => ({ service: find('services', path.id) }));
    this.mockEndpoint('getServiceVariables', this.data.serviceVariables);
    this.mockEndpoint('createService', this.createService);

    // deployments
    this.mockEndpoint('getDeployment', ({ path }) => ({ deployment: find('deployments', path.id) }));

    // instances
    this.mockEndpoint('listInstances', this.listInstances);

    // streams
    this.mockStream('logs', () => this.data.stream);
  }

  private listSecrets: MockEndpointFunction<'listSecrets'> = ({ query }) => {
    return {
      secrets: this.data.secrets.filter((secret) => {
        if (query?.types === undefined) {
          return true;
        }

        return query.types.includes(secret.type!);
      }),
    };
  };

  private listRepositoryBranches: MockEndpointFunction<'listRepositoryBranches'> = ({ query }) => {
    return {
      branches: this.data.branches.filter(hasProperty('repository_id', query?.repository_id)),
    };
  };

  private createApp: MockEndpointFunction<'createApp'> = ({ body }) => {
    const app = createApiApp(body);

    this.data.apps.push(app);

    return { app };
  };

  private createService: MockEndpointFunction<'createService'> = ({ query, body }) => {
    if (query?.dry_run) {
      return { service: {} };
    }

    const service = createApiService({
      app_id: body.app_id,
    });

    const deployment = createApiDeployment({
      app_id: body.app_id,
      service_id: service.id,
      definition: body.definition,
    });

    const instance = createApiInstance({
      app_id: body.app_id,
      service_id: service.id,
      xyz_deployment_id: deployment.id,
      status: 'HEALTHY',
    });

    this.data.services.push(service);
    this.data.deployments.push(deployment);
    this.data.instances.push(instance);

    return { service };
  };

  private listInstances: MockEndpointFunction<'listInstances'> = ({ query }) => {
    return {
      instances: this.data.instances.filter((instance) => {
        if (query?.deployment_id === undefined) {
          return true;
        }

        return query.deployment_id === instance.xyz_deployment_id;
      }),
    };
  };
}
