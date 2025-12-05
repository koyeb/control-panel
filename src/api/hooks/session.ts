import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';

import { setToken } from 'src/application/token';
import { useSeon } from 'src/hooks/seon';

import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';
import { apiMutation, apiQuery, getApiQueryKey } from '../query';

export function useUserQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/profile', {}),
    select: (result) => mapUser(result.user!),
  });
}

export function useUser() {
  return useUserQuery().data;
}

export function useOrganizationQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/organization', {}),
    select: (result) => mapOrganization(result.organization!),
  });
}

export function useOrganization() {
  return useOrganizationQuery().data;
}

export function useSwitchOrganization(onSuccess?: () => void) {
  const getSeonFingerprint = useSeon();
  const authKit = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    ...apiMutation('post /v1/organizations/{id}/switch', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess({ token }) {
      if (!authKit.user) {
        setToken(token!.id!);
      }

      await queryClient.refetchQueries({ queryKey: getApiQueryKey('get /v1/account/organization', {}) });
      queryClient.removeQueries({ predicate: (query) => !query.isActive() });
      void queryClient.invalidateQueries();

      onSuccess?.();
    },
  });
}

export function useOrganizationSummaryQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...apiQuery('get /v1/organizations/{organization_id}/summary', {
      path: { organization_id: organization?.id as string },
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
      path: { organization_id: organization?.id as string },
    }),
    refetchInterval: false,
    select: ({ quotas }) => mapOrganizationQuotas(quotas!),
  });
}

export function useOrganizationQuotas() {
  return useOrganizationQuotasQuery().data;
}
