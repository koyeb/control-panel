import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useSetToken } from 'src/application/authentication';
import { useIdentifyUser } from 'src/application/posthog';
import { ValidateLinkOptions } from 'src/components/link';
import { urlToLinkOptions, useNavigate } from 'src/hooks/router';
import { AssertionError, defined } from 'src/utils/assert';

import { isAccountLockedError } from '../api-errors';
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
    ...useApiQueryFn('getCurrentUser', {}),
    select: (result) => mapUser(result.user!),
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
    ...useApiQueryFn('getCurrentOrganization', {}),
    select: (result) => mapOrganization(result.organization!),
  });
}

export function useOrganizationUnsafe() {
  return useOrganizationQuery().data ?? undefined;
}

export function useOrganization() {
  return defined(useOrganizationUnsafe(), new AssertionError('Organization is not set'));
}

export function useOrganizationSummaryQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...useApiQueryFn('organizationSummary', { path: { organization_id: organization.id } }),
    select: ({ summary }) => mapOrganizationSummary(summary!),
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...useApiQueryFn('organizationQuotas', { path: { organization_id: organization.id } }),
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

export function useLogoutMutation(redirect: ValidateLinkOptions['to'], session?: boolean) {
  const userQuery = useUserQuery();
  const setToken = useSetToken();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  return useMutation({
    ...useApiMutationFn('logout', {}),
    meta: { showError: !isAccountLockedError(userQuery.error) },
    async onSettled() {
      clearIdentify();
      await setToken(null, session);
      await navigate(urlToLinkOptions(redirect));
    },
  });
}
