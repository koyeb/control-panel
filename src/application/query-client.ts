import { Mutation, MutationCache, Query, QueryCache, QueryClient, QueryKey } from '@tanstack/react-query';
import { navigate } from 'wouter/use-browser-location';

import { inArray } from 'src/utils/arrays';
import { getConfig } from 'src/utils/config';

import { ApiError, isApiNotFoundError } from '../api/api-errors';

import { notify } from './notify';
import { reportError } from './report-error';

type UnknownQuery = Query<unknown, unknown, unknown, QueryKey>;
type UnknownMutation = Mutation<unknown, unknown, unknown, unknown>;

export function createQueryClient() {
  const queryCache = new QueryCache({
    onSuccess: onQuerySuccess,
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

  window.queryClient = queryClient;

  return queryClient;
}

declare global {
  interface Window {
    queryClient: QueryClient;
  }
}

function refetchInterval(query: Query) {
  const disablePolling = getConfig('disablePolling');

  if (disablePolling || query.state.error) {
    return false;
  }

  return 5 * 1000;
}

function retry(failureCount: number, error: Error) {
  if (ApiError.is(error) && inArray(error.status, [401, 403, 404])) {
    return false;
  }

  return failureCount < 3;
}

function throwOnError(error: Error) {
  return ApiError.is(error) && error.status >= 500;
}

function onQuerySuccess(data: unknown, query: UnknownQuery) {
  const { pathname, search } = window.location;
  const searchParams = new URLSearchParams(search);

  if (query.queryKey[0] === 'getCurrentUser' && !isAuthenticatedRoute(pathname)) {
    navigate(searchParams.get('next') ?? '/');
  }
}

function onQueryError(error: Error, query: UnknownQuery) {
  const { showError } = { showError: true, ...query.meta };
  const pathname = window.location.pathname;

  if (ApiError.is(error)) {
    if (error.status === 401) {
      // organization is deactivated
      if (error.message === 'Token rejected') {
        navigate('/settings');
      } else {
        handleAuthenticationError();
      }
    }

    // user removed from organization
    if (error.status === 403) {
      handleAuthenticationError();
    }

    if (error.status === 429) {
      notify.error(error.message);
    }

    if (
      isApiNotFoundError(error) &&
      inArray(query.queryKey[0], ['getApp', 'getService', 'getDeployment']) &&
      pathname !== '/'
    ) {
      notify.info(error.message);
      navigate('/');
    }

    if (error.status >= 500) {
      notify.error(error.message);
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
  if (ApiError.is(error, 401)) {
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

  if (pathname === '/account/oauth/github/callback') {
    return true;
  }

  return !isUnauthenticatedRoute(pathname);
}

function handleAuthenticationError() {
  localStorage.removeItem('access-token');
  sessionStorage.removeItem('session-token');

  if (!isUnauthenticatedRoute(window.location.pathname)) {
    const next = window.location.href.slice(window.location.origin.length);
    let location = '/auth/signin';

    if (next !== '/') {
      location += `?${new URLSearchParams({ next }).toString()}`;
    }

    // use full page reload to avoid refetching resources
    window.location.assign(location);
  }
}
