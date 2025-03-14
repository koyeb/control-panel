import { useQuery } from '@tanstack/react-query';

import { inArray } from 'src/utils/arrays';
import { AssertionError, defined } from 'src/utils/assert';

import { isApiError } from '../api-errors';
import {
  mapOrganization,
  mapOrganizationMembers,
  mapOrganizationQuotas,
  mapOrganizationSummary,
  mapUser,
} from '../mappers/session';
import { useApiQueryFn } from '../use-api';

const disableRefetch = {
  refetchInterval: false,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useUserQuery() {
  return useQuery({
    ...useApiQueryFn('getCurrentUser'),
    select: mapUser,
    throwOnError: (error) => {
      if (!isApiError(error)) {
        return true;
      }

      return !inArray(error.code, ['authentication_error', 'authorization_error']);
    },
  });
}

export function useUserUnsafe() {
  return useUserQuery().data;
}

export function useUser() {
  return defined(useUserUnsafe(), new AssertionError('User is not set'));
}

export function useOrganizationQuery() {
  return useQuery({
    ...useApiQueryFn('getCurrentOrganization'),
    select: mapOrganization,
    throwOnError: (error) => {
      if (!isApiError(error)) {
        return true;
      }

      return !inArray(error.code, ['authentication_error', 'authorization_error', 'not_found']);
    },
  });
}

export function useOrganizationUnsafe() {
  return useOrganizationQuery().data;
}

export function useOrganization() {
  return defined(useOrganizationUnsafe(), new AssertionError('Organization is not set'));
}

export function useOrganizationSummaryQuery() {
  const { data: organization } = useOrganizationQuery();
  const organizationId = organization?.id;

  return useQuery({
    ...disableRefetch,
    ...useApiQueryFn('organizationSummary', { path: { organization_id: organizationId! } }),
    enabled: organizationId !== undefined,
    select: mapOrganizationSummary,
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const { data: organization } = useOrganizationQuery();
  const organizationId = organization?.id;

  return useQuery({
    ...disableRefetch,
    ...useApiQueryFn('organizationQuotas', { path: { organization_id: organizationId! } }),
    enabled: organizationId !== undefined,
    select: mapOrganizationQuotas,
  });
}

export function useOrganizationQuotas() {
  return useOrganizationQuotasQuery().data;
}

export function useUserOrganizationMemberships() {
  const user = useUserUnsafe();

  return useQuery({
    ...disableRefetch,
    ...useApiQueryFn('listOrganizationMembers', { query: { user_id: user?.id } }),
    enabled: user !== undefined,
    select: mapOrganizationMembers,
  });
}
