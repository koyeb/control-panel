import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { AssertionError, defined } from 'src/utils/assert';

import { useNavigate } from '@tanstack/react-router';
import { useSetToken } from 'src/application/authentication';
import { api } from '../api';
import { ApiError } from '../api-errors';
import {
  mapOrganization,
  mapOrganizationMember,
  mapOrganizationQuotas,
  mapOrganizationSummary,
  mapUser,
} from '../mappers/session';
import { useApiMutationFn, useApiQueryFn } from '../use-api';

export function useUserQuery() {
  return useSuspenseQuery({
    ...useApiQueryFn('getCurrentUser'),
    select: ({ user }) => mapUser(user!),
  });
}

export function useUserUnsafe() {
  return useUserQuery().data;
}

export function useUser() {
  return defined(useUserUnsafe(), new AssertionError('User is not set'));
}

export function getCurrentOrganization() {
  return api.getCurrentOrganization({}).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      return { organization: null };
    }

    throw error;
  });
}

export function useOrganizationQuery() {
  return useSuspenseQuery({
    ...useApiQueryFn('getCurrentOrganization'),
    queryFn: getCurrentOrganization,
    select: ({ organization }) => {
      if (organization === null) {
        return null;
      }

      return mapOrganization(organization!);
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

export function useLogoutMutation() {
  const setToken = useSetToken();
  const navigate = useNavigate();
  // todo
  // const resetIdentify = useResetIdentifyUser();

  return useMutation({
    ...useApiMutationFn('logout', {}),
    onSettled: async () => {
      setToken(null);
      // resetIdentify();
      await navigate({ to: '/auth/signin' });
    },
  });
}
