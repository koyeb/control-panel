import { useMutation, useQuery } from '@tanstack/react-query';

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
  const organization = useOrganizationUnsafe();

  return useQuery({
    ...useApiQueryFn('organizationSummary', { path: { organization_id: organization!.id } }),
    enabled: Boolean(organization),
    select: ({ summary }) => mapOrganizationSummary(summary!),
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const organization = useOrganizationUnsafe();

  return useQuery({
    ...useApiQueryFn('organizationQuotas', { path: { organization_id: organization!.id } }),
    enabled: Boolean(organization),
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
  const navigate = useNavigate();

  return useMutation({
    ...useApiMutationFn('logout', {}),
    meta: { showError: !isAccountLockedError(userQuery.error) },
    onSettled: () => {
      navigate({
        ...urlToLinkOptions(redirect),
        state: { token: null, session },
      });
    },
  });
}
