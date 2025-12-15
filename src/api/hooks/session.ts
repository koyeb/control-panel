import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';

import { apiQuery, getApi, getApiQueryKey } from 'src/api';
import { isFeatureFlagEnabled } from 'src/hooks/feature-flag';

import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';

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

export function useSwitchOrganization({ onSuccess }: { onSuccess?: () => unknown } = {}) {
  const { switchToOrganization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id: organizationId, externalId }: { id: string; externalId?: string }) => {
      if (externalId && (await isFeatureFlagEnabled('workos-switch-organization'))) {
        await switchToOrganization({ organizationId: externalId });
      } else {
        const api = getApi();
        await api('post /v1/organizations/{id}/switch', { path: { id: organizationId } });
      }
    },
    async onSuccess() {
      queryClient.removeQueries({ predicate: (query) => !query.isActive() });
      await queryClient.refetchQueries({ queryKey: getApiQueryKey('get /v1/account/organization', {}) });
      await queryClient.invalidateQueries();
      await onSuccess?.();
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
