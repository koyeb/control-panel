import { Integrations } from '@segment/analytics-next';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  Mutation,
  MutationCache,
  Query,
  QueryCache,
  QueryCacheNotifyEvent,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import posthog from 'posthog-js';
import { navigate } from 'wouter/use-browser-location';

import { api } from 'src/api/api';
import { Organization, User } from 'src/api/model';
import { useLocalStorage } from 'src/hooks/storage';
import { inArray } from 'src/utils/arrays';

import { isApiError, isApiNotFoundError } from '../api/api-errors';

import { Analytics } from './analytics';
import { getConfig } from './config';
import { notify } from './notify';
import { identifyUserInSentry, reportError } from './report-error';
import { routes } from './routes';
import { getAccessToken, getSessionToken } from './token';

type UnknownQuery = Query<unknown, unknown, unknown, QueryKey>;
type UnknownMutation = Mutation<unknown, unknown, unknown, unknown>;

export function createQueryClient(analytics: Analytics) {
  const { version } = getConfig();

  const queryCache = new QueryCache({
    onSuccess: onQuerySuccess(),
    onError: onQueryError,
  });

  const mutationCache = new MutationCache({
    onError: onMutationError,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchInterval,
        retry,
        throwOnError,
      },
      mutations: {
        throwOnError,
      },
    },
    queryCache,
    mutationCache,
  });

  queryCache.subscribe(onQueryCacheChanged(analytics));

  void persistQueryClient({
    queryClient,
    buster: version,
    persister: createSyncStoragePersister({
      key: 'query-cache',
      storage: getSessionToken() ? window.sessionStorage : window.localStorage,
    }),
  });

  window.queryClient = queryClient;

  return queryClient;
}

declare global {
  interface Window {
    queryClient: QueryClient;
  }
}

function refetchInterval(query: Query) {
  const { disablePolling } = getConfig();

  if (disablePolling || query.state.error) {
    return false;
  }

  return 5 * 1000;
}

function retry(failureCount: number, error: Error) {
  if (isApiError(error) && inArray(error.status, [401, 403, 404])) {
    return false;
  }

  return failureCount < 3;
}

function throwOnError(error: Error) {
  return isApiError(error) && error.status >= 500;
}

function onQueryCacheChanged(analytics: Analytics) {
  let prevUser: User | undefined;
  let prevOrganization: Organization | undefined;

  async function listener(event: QueryCacheNotifyEvent) {
    const { type, query } = event;

    if (type !== 'updated') {
      return;
    }

    const action = event.action;
    const queryKey = query.queryKey as [string];

    if (queryKey[0] === 'getCurrentUser') {
      if (action.type === 'success' && prevUser === undefined) {
        const { user } = action.data as { user: User };

        await identifyUserInSentry(user);
        await identifyUser(analytics, user);

        prevUser = user;
      }

      if (action.type === 'error' && prevUser !== undefined) {
        await identifyUserInSentry(null);
        await analytics.reset();

        globalThis.Intercom?.('shutdown');

        prevUser = undefined;
      }
    }

    if (queryKey[0] === 'getCurrentOrganization') {
      if (action.type === 'success' && prevOrganization === undefined && action.data !== null) {
        const { organization } = action.data as { organization: Organization };

        posthog.group('segment_group', organization.id);
        prevOrganization = organization;
      }

      if (action.type === 'error' && prevOrganization !== undefined) {
        prevOrganization = undefined;
      }
    }
  }

  return function (event: QueryCacheNotifyEvent) {
    listener(event).catch(reportError);
  };
}

function onQuerySuccess() {
  return function (data: unknown, query: UnknownQuery) {
    const { pathname, search } = window.location;
    const searchParams = new URLSearchParams(search);

    if (query.queryKey[0] === 'getCurrentUser' && !isAuthenticatedRoute(pathname)) {
      navigate(searchParams.get('next') ?? routes.home());
    }
  };
}

async function identifyUser(analytics: Analytics, user: User) {
  const { hash } = await api.getIntercomUserHash({
    token: getAccessToken() ?? undefined,
  });

  const traits = {};
  const integrations: Integrations = {};

  if (hash !== undefined) {
    integrations.Intercom = { user_hash: hash };
  }

  await analytics.identify(user.id, traits, { integrations });
}

function onQueryError(error: Error, query: UnknownQuery) {
  const { showError } = { showError: true, ...query.meta };
  const pathname = window.location.pathname;

  if (isApiError(error)) {
    if (error.status === 401) {
      // organization is deactivated
      if (error.message === 'Token rejected') {
        navigate(routes.organizationSettings.index());
      } else {
        handleAuthenticationError();
      }
    }

    if (
      isApiNotFoundError(error) &&
      inArray(query.queryKey[0], ['getApp', 'getService', 'getDeployment']) &&
      pathname !== routes.home()
    ) {
      notify.info(error.message);
      navigate(routes.home());
    }

    if (error.status >= 500) {
      reportError(error);
    }
  } else {
    if (showError) {
      reportError(error);
      notify.error(error.message);
    }
  }
}

function onMutationError(error: Error, variables: unknown, context: unknown, mutation: UnknownMutation) {
  if (isApiError(error) && error.status === 401) {
    handleAuthenticationError();
  } else if (mutation.options.onError === undefined) {
    notify.error(error.message);
  }
}

function isUnauthenticatedRoute(pathname: string) {
  return [
    pathname.startsWith('/auth'),
    pathname.startsWith('/account/reset-password'),
    pathname.startsWith('/account/oauth/github/callback'),
  ].some(Boolean);
}

function isAuthenticatedRoute(pathname: string) {
  if (pathname.startsWith('/account/reset-password')) {
    return true;
  }

  return !isUnauthenticatedRoute(pathname);
}

function handleAuthenticationError() {
  localStorage.removeItem('access-token');
  useLocalStorage.onItemChanged('access-token', undefined);

  if (!isUnauthenticatedRoute(window.location.pathname)) {
    const next = window.location.href.slice(window.location.origin.length);
    let location = routes.signIn();

    if (next !== routes.home()) {
      location += `?${new URLSearchParams({ next }).toString()}`;
    }

    // use full page reload to avoid refetching resources
    window.location.assign(location);
  }
}
