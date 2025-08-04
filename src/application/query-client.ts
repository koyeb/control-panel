import { Mutation, MutationCache, Query, QueryCache, QueryClient, QueryKey } from '@tanstack/react-query';
import { navigate } from 'wouter/use-browser-location';

import { TOKENS } from 'src/tokens';
import { inArray } from 'src/utils/arrays';
import { getConfig } from 'src/utils/config';

import { ApiError, isApiNotFoundError } from '../api/api-errors';

import { container } from './container';
import { notify } from './notify';
import { reportError } from './report-error';

type UnknownQuery = Query<unknown, unknown, unknown, QueryKey>;
type UnknownMutation = Mutation<unknown, unknown, unknown, unknown>;

const queryCache = new QueryCache({
  onSuccess: onQuerySuccess,
  onError: onQueryError,
});

const mutationCache = new MutationCache({
  onError: onMutationError,
});

export const queryClient = new QueryClient({
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
    if (error.status === 403 && error.message === 'User is not a member of the organization') {
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
  const { showError } = { showError: true, ...mutation.meta };

  if (ApiError.is(error, 401)) {
    handleAuthenticationError();
  } else if (mutation.options.onError === undefined && showError) {
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
  const location = new URL(window.location.href);
  const auth = container.resolve(TOKENS.authentication);

  if (auth.token !== null) {
    auth.setToken(null);
    queryClient.clear();
  }

  if (!location.pathname.startsWith('/auth')) {
    const redirect = new URL('/auth/signin', location);
    const next = location.href.slice(location.origin.length);

    if (isAuthenticatedRoute(location.pathname) && next !== '/') {
      redirect.searchParams.set('next', next);
    }

    navigate(redirect);
  }
}
