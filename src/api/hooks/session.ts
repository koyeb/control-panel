import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { apiMutation, apiQuery } from 'src/api/api';
import { useSetToken } from 'src/application/authentication';
import { useIdentifyUser } from 'src/application/posthog';
import { ValidateLinkOptions } from 'src/components/link';
import { urlToLinkOptions, useNavigate } from 'src/hooks/router';
import { AssertionError, defined } from 'src/utils/assert';

import { ApiError } from '../api-errors';
import {
  mapOrganization,
  mapOrganizationMember,
  mapOrganizationQuotas,
  mapOrganizationSummary,
  mapUser,
} from '../mappers/session';

export function useUserQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/profile', {}),
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
    ...apiQuery('get /v1/account/organization', {}),
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
    ...apiQuery('get /v1/organizations/{organization_id}/summary', {
      path: { organization_id: organization.id },
    }),
    select: ({ summary }) => mapOrganizationSummary(summary!),
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...apiQuery('get /v1/organizations/{organization_id}/quotas', {
      path: { organization_id: organization.id },
    }),
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
    ...apiQuery('get /v1/organization_members', { query: { user_id: user?.id } }),
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
    ...apiMutation('delete /v1/account/logout', {}),
    meta: { showError: !ApiError.isAccountLockedError(userQuery.error) },
    async onSettled() {
      if (!session) {
        clearIdentify();
      }

      await setToken(null, session);
      await navigate(urlToLinkOptions(redirect));
    },
  });
}
