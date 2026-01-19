import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { unstable_useWidgetsInvalidator as useWidgetsInvalidator } from '@workos-inc/widgets/utils';

import { apiQuery, getApiQueryKey, useApi } from 'src/api';

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

export function useSwitchOrganization({ onSuccess }: { onSuccess?: () => void | Promise<void> } = {}) {
  const queryClient = useQueryClient();
  const { switchToOrganization } = useAuth();
  const invalidateWidgets = useWidgetsInvalidator();
  const api = useApi();

  return useMutation({
    mutationFn: async ({ id: organizationId, externalId }: { id: string; externalId?: string }) => {
      if (externalId) {
        await switchToOrganization({ organizationId: externalId });
      } else {
        await api('post /v1/organizations/{id}/switch', { path: { id: organizationId } });
      }
    },
    async onSuccess() {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: getApiQueryKey('get /v1/account/organization', {}) }),
        queryClient.invalidateQueries(),
        invalidateWidgets(),
      ]);

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
