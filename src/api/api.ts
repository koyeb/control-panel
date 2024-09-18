import { EmptyObject, IfNever, Simplify } from 'type-fest';

import { getConfig } from 'src/application/config';
import { UnexpectedError } from 'src/application/errors';
import { wait } from 'src/utils/promises';
import { upperCase } from 'src/utils/strings';

import { ApiError, ApiValidationError, isApiError, isApiValidationError } from './api-errors';
import Api from './api.generated';

export const api = {
  getOAuthProviders: endpoint('get', '/v1/account/oauth'),
  githubOAuthCallback: endpoint('post', '/v1/account/oauth'),
  signIn: endpoint('post', '/v1/account/login'),
  signUp: endpoint('post', '/v1/account/signup'),
  setUpOAuth: endpoint('get', '/v1/account/oauth'),
  cannySso: endpoint('post', '/v1/sso/canny'),
  discourseSso: endpoint('post', '/v1/sso/discourse'),
  resetPassword: endpoint('post', '/v1/account/reset_password'),
  updatePassword: endpoint('post', '/v1/account/update_password'),
  resendValidationEmail: endpoint('post', '/v1/account/resend_validation'),
  validateAccount: endpoint('post', '/v1/account/validate/{id}'),
  logout: endpoint('delete', '/v1/account/logout'),
  getCurrentUser: endpoint('get', '/v1/account/profile'),
  getIntercomUserHash: endpoint('get', '/v1/intercom/profile'),
  updateUser: endpoint('patch', '/v1/account/profile'),
  deleteUser: endpoint('delete', '/v1/users/{id}'),
  getCurrentOrganization: endpoint('get', '/v1/account/organization'),
  listOrganizationMembers: endpoint('get', '/v1/organization_members'),
  deleteOrganizationMember: endpoint('delete', '/v1/organization_members/{id}'),
  organizationSummary: endpoint('get', '/v1/organizations/{organization_id}/summary'),
  organizationQuotas: endpoint('get', '/v1/organizations/{organization_id}/quotas'),
  switchOrganization: endpoint('post', '/v1/organizations/{id}/switch'),
  unscopeOrganizationToken: endpoint('post', '/v1/unscope_organization_token'),
  createOrganization: endpoint('post', '/v1/organizations'),
  updateOrganization: endpoint('patch', '/v1/organizations/{id}'),
  updateSignupQualification: endpoint('post', '/v1/organizations/{id}/signup_qualification'),
  deleteOrganization: endpoint('delete', '/v1/organizations/{id}'),
  deactivateOrganization: endpoint('post', '/v1/organizations/{id}/deactivate'),
  reactivateOrganization: endpoint('post', '/v1/organizations/{id}/reactivate'),
  organizationConfirmation: endpoint('post', '/v1/organization_confirmations/{id}'),
  changePlan: endpoint('post', '/v1/organizations/{id}/plan'),
  getSubscription: endpoint('get', '/v1/subscriptions/{id}'),
  manageBilling: endpoint('get', '/v1/billing/manage'),
  createPaymentAuthorization: endpoint('post', '/v1/payment_methods'),
  confirmPaymentAuthorization: endpoint('post', '/v1/payment_methods/{id}/confirm'),
  getNextInvoice: endpoint('get', '/v1/billing/next_invoice'),
  hasUnpaidInvoices: endpoint('get', '/v1/billing/has_unpaid_invoices'),
  getUsageCsv: endpoint('get', '/v1/usages/details'),
  listInvitations: endpoint('get', '/v1/organization_invitations'),
  getInvitation: endpoint('get', '/v1/organization_invitations/{id}'),
  sendInvitation: endpoint('post', '/v1/organization_invitations'),
  resendInvitation: endpoint('post', '/v1/organization_invitations/{id}/resend'),
  acceptInvitation: endpoint('post', '/v1/account/organization_invitations/{id}/accept'),
  declineInvitation: endpoint('post', '/v1/account/organization_invitations/{id}/decline'),
  deleteInvitation: endpoint('delete', '/v1/organization_invitations/{id}'),
  listCatalogRegions: endpoint('get', '/v1/catalog/regions'),
  listCatalogDatacenters: endpoint('get', '/v1/catalog/datacenters'),
  listCatalogInstances: endpoint('get', '/v1/catalog/instances'),
  verifyDockerImage: endpoint('get', '/v1/docker-helper/verify'),
  listVolumes: endpoint('get', '/v1/volumes'),
  createVolume: endpoint('post', '/v1/volumes'),
  updateVolume: endpoint('post', '/v1/volumes/{id}'),
  deleteVolume: endpoint('delete', '/v1/volumes/{id}'),
  listSecrets: endpoint('get', '/v1/secrets'),
  revealSecret: endpoint('post', '/v1/secrets/{id}/reveal'),
  createSecret: endpoint('post', '/v1/secrets'),
  updateSecret: endpoint('put', '/v1/secrets/{id}'),
  deleteSecret: endpoint('delete', '/v1/secrets/{id}'),
  listDomains: endpoint('get', '/v1/domains'),
  createDomain: endpoint('post', '/v1/domains'),
  editDomain: endpoint('patch', '/v1/domains/{id}'),
  refreshDomain: endpoint('post', '/v1/domains/{id}/refresh'),
  deleteDomain: endpoint('delete', '/v1/domains/{id}'),
  getGithubApp: endpoint('get', '/v1/github/installation'),
  installGithubApp: endpoint('post', '/v1/github/installation'),
  installGithubAppCallback: endpoint('post', '/v1/github/installation/callback'),
  resyncRepositories: endpoint('post', '/v1/git/sync/organization/{organization_id}'),
  listRepositories: endpoint('get', '/v1/git/repositories'),
  listRepositoryBranches: endpoint('get', '/v1/git/branches'),
  listApps: endpoint('get', '/v1/apps'),
  getApp: endpoint('get', '/v1/apps/{id}'),
  createApp: endpoint('post', '/v1/apps'),
  renameApp: endpoint('put', '/v1/apps/{id}'),
  pauseApp: endpoint('post', '/v1/apps/{id}/pause'),
  resumeApp: endpoint('post', '/v1/apps/{id}/resume'),
  deleteApp: endpoint('delete', '/v1/apps/{id}'),
  listServices: endpoint('get', '/v1/services'),
  getService: endpoint('get', '/v1/services/{id}'),
  getServiceMetrics: endpoint('get', '/v1/streams/metrics'),
  getServiceVariables: endpoint('post', '/v1/services-autocomplete'),
  createService: endpoint('post', '/v1/services'),
  updateService: endpoint('put', '/v1/services/{id}'),
  redeployService: endpoint('post', '/v1/services/{id}/redeploy'),
  pauseService: endpoint('post', '/v1/services/{id}/pause'),
  resumeService: endpoint('post', '/v1/services/{id}/resume'),
  deleteService: endpoint('delete', '/v1/services/{id}'),
  listDeployments: endpoint('get', '/v1/deployments'),
  getDeployment: endpoint('get', '/v1/deployments/{id}'),
  cancelDeployment: endpoint('post', '/v1/deployments/{id}/cancel'),
  listInstances: endpoint('get', '/v1/instances'),
  listActivities: endpoint('get', '/v1/activities'),
  listApiCredentials: endpoint('get', '/v1/credentials'),
  createApiCredential: endpoint('post', '/v1/credentials'),
  deleteApiCredential: endpoint('delete', '/v1/credentials/{id}'),
};

export const apiStreams = {
  logs: stream('/v1/streams/logs/tail'),
  exec: stream('/v1/streams/instances/exec'),
};

declare global {
  interface Window {
    api: typeof api;
    apiStreams: typeof apiStreams;
  }
}

if (typeof window !== 'undefined') {
  window.api = api;
  window.apiStreams = apiStreams;
}

type Endpoint = keyof typeof api;

type ApiEndpoints = {
  [E in Endpoint]: {
    params: Parameters<(typeof api)[E]>[0];
    result: Awaited<ReturnType<(typeof api)[E]>>;
  };
};

export type ApiEndpointParams<E extends Endpoint> = ApiEndpoints[E]['params'];
export type ApiEndpointResult<E extends Endpoint> = ApiEndpoints[E]['result'];

type CommonApiRequestParams = {
  token?: string;
  delay?: number;
};

type ApiRequestParams<Params extends EndpointParams, Body> = Simplify<
  CommonApiRequestParams &
    ApiRequestOption<'path', GetParam<Params, 'path'>> &
    ApiRequestOption<'query', GetParam<Params, 'query'>> &
    ApiRequestOption<'header', GetParam<Params, 'header'>> &
    ApiRequestOption<'body', Body extends Record<string, never> ? never : Body>
>;

type GetParam<Params extends EndpointParams, Key extends keyof Params> = Params extends {
  [K in Key]: infer Value;
}
  ? Value extends undefined
    ? never
    : Value
  : never;

type ApiRequestOption<Key extends PropertyKey, Value> = IfNever<Value, EmptyObject, { [K in Key]: Value }>;

type EndpointParams = {
  path?: Record<string, string>;
  query?: Record<string, unknown>;
  header?: Record<string, string>;
};

type InferParams<E> = E extends { parameters: infer Params extends EndpointParams } ? Params : never;
type InferBody<E> = E extends { requestBody: { content: { '*/*': infer Body } } } ? Body : never;
type InferResult<E> = E extends { responses: { 200: { content: { '*/*': infer Result } } } } ? Result : never;

function endpoint<Method extends keyof Api.paths[Path], Path extends keyof Api.paths>(
  method: Method,
  path: Path,
) {
  type Endpoint = Api.paths[Path][Method];
  type Params = InferParams<Endpoint>;
  type Body = InferBody<Endpoint>;
  type Result = InferResult<Endpoint>;

  return async (params: ApiRequestParams<Params, Body>): Promise<Result> => {
    const url = buildUrl(path, params as EndpointParams);
    const headers = new Headers();

    const init: RequestInit = {
      method: upperCase(method as string),
      headers,
    };

    if (params.token !== undefined && path !== '/v1/account/login') {
      headers.set('Authorization', `Bearer ${params.token}`);
    }

    if ('body' in params && params.body != null) {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(params.body);
    }

    if ('header' in params && params.header != null) {
      for (const [name, value] of Object.entries(params.header as Record<string, string>)) {
        headers.set(name, value);
      }
    }

    if (params.delay !== undefined) {
      await wait(params.delay);
    }

    const response = await fetch(url.toString(), init);

    const responseBody: unknown = response.headers.get('Content-Type')?.startsWith('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw buildError(responseBody);
    }

    return responseBody as InferResult<Endpoint>;
  };
}

function buildUrl(path: string, params: EndpointParams) {
  for (const [key, value] of Object.entries(params.path ?? {})) {
    path = path.replaceAll(`{${key}}`, value);
  }

  const { apiBaseUrl } = getConfig();
  const url = new URL(path, apiBaseUrl ?? window.location.origin);

  for (const [key, value] of Object.entries(params.query ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((value) => url.searchParams.append(key, String(value)));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function buildError(body: unknown) {
  if (isApiValidationError(body)) {
    return new ApiValidationError(body);
  }

  if (isApiError(body)) {
    return new ApiError(body);
  }

  return new UnexpectedError('Unknown API error', { body });
}

declare global {
  interface Window {
    sockets: WebSocket[];
  }
}

export type ApiStream = Pick<
  WebSocket,
  'addEventListener' | 'removeEventListener' | 'close' | 'readyState' | 'send'
>;

type StreamPath = Extract<keyof Api.paths, `/v1/streams/${string}`>;

type StreamParams<Path extends StreamPath> = InferParams<Api.paths[Path]['get']> & {
  token?: string;
};

function stream<Path extends StreamPath>(path: Path) {
  return function (params: StreamParams<Path>): ApiStream {
    const url = String(buildUrl(path, params)).replace(/^http/, 'ws');
    const protocols: string[] = [];

    if (params.token) {
      protocols.push('Bearer', params.token);
    }

    const socket = new WebSocket(url, protocols);

    window.sockets ??= [];
    window.sockets.push(socket);

    return socket;
  };
}
