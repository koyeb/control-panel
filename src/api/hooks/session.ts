import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { useAuth } from 'src/application/authentication';
import { useNavigate } from 'src/hooks/router';
import { inArray } from 'src/utils/arrays';
import { AssertionError, defined } from 'src/utils/assert';

import { isApiError } from '../api-errors';
import {
  mapOrganization,
  mapOrganizationMember,
  mapOrganizationQuotas,
  mapOrganizationSummary,
  mapUser,
} from '../mappers/session';
import { useApiMutationFn, useApiQueryFn } from '../use-api';

export function useUserQuery() {
  return useQuery({
    ...useApiQueryFn('getCurrentUser'),
    placeholderData: keepPreviousData,
    select: ({ user }) => mapUser(user!),
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
    placeholderData: keepPreviousData,
    select: ({ organization }) => mapOrganization(organization!),
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
    ...useApiQueryFn('organizationSummary', { path: { organization_id: organizationId! } }),
    enabled: organizationId !== undefined,
    select: ({ summary }) => mapOrganizationSummary(summary!),
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const { data: organization } = useOrganizationQuery();
  const organizationId = organization?.id;

  return useQuery({
    ...useApiQueryFn('organizationQuotas', { path: { organization_id: organizationId! } }),
    enabled: organizationId !== undefined,
    refetchInterval: false,
    select: ({ quotas }) => mapOrganizationQuotas(quotas!),
  });
}

export function useOrganizationQuotas() {
  return useOrganizationQuotasQuery().data;
}

export function useUserOrganizationMemberships() {
  const user = useUserUnsafe();

  return useQuery({
    ...useApiQueryFn('listOrganizationMembers', { query: { user_id: user?.id } }),
    refetchInterval: false,
    enabled: user !== undefined,
    select: ({ members }) => members!.map(mapOrganizationMember),
  });
}

export function useLogoutMutation(redirect: string, session?: boolean) {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    ...useApiMutationFn('logout', {}),
    onSettled: () => {
      setToken(null, session);
      navigate(redirect);
    },
  });
}
